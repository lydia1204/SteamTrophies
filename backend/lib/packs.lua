local fs = require("fs")
local json = require("json")
local millennium = require("millennium")
local storage = require("lib.storage")

local M = {}
local MAX_FILES = 96
local MAX_TOTAL_BYTES = 64 * 1024 * 1024
local MAX_ASSET_BYTES = 4 * 1024 * 1024
local MAX_MANIFEST_BYTES = 128 * 1024
local MAX_IMAGE_DIMENSION = 8192
local MAX_IMAGE_PIXELS = 16777216
local REQUIRED_KEYS = { "trophy.bronze", "trophy.silver", "trophy.gold", "trophy.platinum" }
local PACK_ID_PATTERN = "^[a-z0-9][a-z0-9%._%-][a-z0-9%._%-]+$"
local sequence = 0

local function pack_root()
    return fs.join(storage.root(), "customization", "packs")
end

local function ensure_root()
    local ok, err = fs.create_directories(pack_root())
    if not ok and not fs.is_directory(pack_root()) then error("Unable to create pack root: " .. tostring(err)) end
end

local function valid_pack_id(value)
    return type(value) == "string" and #value >= 3 and #value <= 64 and value:match(PACK_ID_PATTERN) ~= nil and not value:match("^builtin%.")
end

local function normalize_relative(path)
    assert(type(path) == "string", "Expected path string")
    local p = path:gsub("\\", "/")
    assert(#p > 0 and #p <= 240, "Invalid relative path length")
    assert(not p:match("^/"), "Absolute paths are forbidden")
    assert(not p:match("^[A-Za-z]:"), "Drive paths are forbidden")
    assert(not p:match("^//"), "UNC paths are forbidden")
    assert(not p:find("//", 1, true) and p:sub(-1) ~= "/", "Empty path segments are forbidden")
    for part in p:gmatch("[^/]+") do
        assert(part ~= "." and part ~= ".." and #part > 0, "Unsafe path segment")
    end
    assert(not p:find("[<>:%\"|%?%*]"), "Unsafe filename")
    return p
end

local function extension(path)
    return fs.extension(path):lower()
end

local function allowed_asset_extension(path)
    local ext = extension(path)
    return ext == ".png" or ext == ".jpg" or ext == ".jpeg" or ext == ".webp"
end

local function allowed_audio_extension(path)
    local ext = extension(path)
    return ext == ".wav" or ext == ".ogg"
end

local function read_binary(path, max_bytes)
    assert(fs.is_file(path), "Asset does not exist")
    local size, err = fs.file_size(path)
    assert(size, "Unable to stat asset: " .. tostring(err))
    assert(size <= max_bytes, "Asset exceeds size limit")
    local handle, open_err = io.open(path, "rb")
    assert(handle, "Unable to open asset: " .. tostring(open_err))
    local bytes = handle:read("*a")
    handle:close()
    return bytes
end

local function u16be(bytes, offset)
    local a, b = bytes:byte(offset, offset + 1)
    assert(a and b, "Truncated image header")
    return a * 256 + b
end

local function u16le(bytes, offset)
    local a, b = bytes:byte(offset, offset + 1)
    assert(a and b, "Truncated image header")
    return a + b * 256
end

local function u24le(bytes, offset)
    local a, b, c = bytes:byte(offset, offset + 2)
    assert(a and b and c, "Truncated image header")
    return a + b * 256 + c * 65536
end

local function u32be(bytes, offset)
    local a, b, c, d = bytes:byte(offset, offset + 3)
    assert(a and b and c and d, "Truncated image header")
    return ((a * 256 + b) * 256 + c) * 256 + d
end

local function image_dimensions(path, bytes)
    local ext = extension(path)
    if ext == ".png" then
        assert(#bytes >= 24, "Truncated PNG")
        return u32be(bytes, 17), u32be(bytes, 21)
    elseif ext == ".jpg" or ext == ".jpeg" then
        local offset = 3
        while offset + 3 <= #bytes do
            if bytes:byte(offset) ~= 0xFF then
                offset = offset + 1
            else
                while offset <= #bytes and bytes:byte(offset) == 0xFF do offset = offset + 1 end
                local marker = bytes:byte(offset)
                offset = offset + 1
                if not marker then break end
                if marker ~= 0xD8 and marker ~= 0xD9 then
                    if marker == 0xDA then break end
                    if offset + 1 > #bytes then break end
                    local length = u16be(bytes, offset)
                    if length < 2 or offset + length - 1 > #bytes then break end
                    local sof = (marker >= 0xC0 and marker <= 0xC3)
                        or (marker >= 0xC5 and marker <= 0xC7)
                        or (marker >= 0xC9 and marker <= 0xCB)
                        or (marker >= 0xCD and marker <= 0xCF)
                    if sof then
                        assert(length >= 7, "Invalid JPEG SOF")
                        return u16be(bytes, offset + 3), u16be(bytes, offset + 5)
                    end
                    offset = offset + length
                end
            end
        end
        error("JPEG dimensions unavailable")
    elseif ext == ".webp" then
        assert(#bytes >= 25, "Truncated WebP")
        local kind = bytes:sub(13, 16)
        if kind == "VP8X" then
            assert(#bytes >= 30, "Truncated VP8X")
            return u24le(bytes, 25) + 1, u24le(bytes, 28) + 1
        elseif kind == "VP8L" then
            assert(#bytes >= 25 and bytes:byte(21) == 0x2F, "Invalid VP8L header")
            local b1, b2, b3, b4 = bytes:byte(22, 25)
            local width = 1 + b1 + (b2 % 64) * 256
            local height = 1 + math.floor(b2 / 64) + b3 * 4 + (b4 % 16) * 1024
            return width, height
        elseif kind == "VP8 " then
            assert(#bytes >= 30, "Truncated VP8")
            assert(bytes:byte(24) == 0x9D and bytes:byte(25) == 0x01 and bytes:byte(26) == 0x2A, "Invalid VP8 header")
            return u16le(bytes, 27) % 16384, u16le(bytes, 29) % 16384
        end
        error("Unsupported WebP chunk")
    end
    return nil, nil
end

local function validate_image_dimensions(path, bytes)
    if not allowed_asset_extension(path) then return end
    local width, height = image_dimensions(path, bytes)
    assert(width and height and width >= 1 and height >= 1, "Invalid image dimensions")
    assert(width <= MAX_IMAGE_DIMENSION and height <= MAX_IMAGE_DIMENSION, "Image dimension exceeds safe decoder budget")
    assert(width * height <= MAX_IMAGE_PIXELS, "Image pixel count exceeds safe decoder budget")
end

local function mime_for_bytes(path, bytes)
    local ext = extension(path)
    if ext == ".png" then
        assert(bytes:sub(1, 8) == "\137PNG\r\n\26\n", "PNG signature mismatch")
        validate_image_dimensions(path, bytes)
        return "image/png"
    elseif ext == ".jpg" or ext == ".jpeg" then
        assert(bytes:byte(1) == 0xFF and bytes:byte(2) == 0xD8 and bytes:byte(3) == 0xFF, "JPEG signature mismatch")
        validate_image_dimensions(path, bytes)
        return "image/jpeg"
    elseif ext == ".webp" then
        assert(bytes:sub(1, 4) == "RIFF" and bytes:sub(9, 12) == "WEBP", "WebP signature mismatch")
        validate_image_dimensions(path, bytes)
        return "image/webp"
    elseif ext == ".wav" then
        assert(bytes:sub(1, 4) == "RIFF" and bytes:sub(9, 12) == "WAVE", "WAV signature mismatch")
        return "audio/wav"
    elseif ext == ".ogg" then
        assert(bytes:sub(1, 4) == "OggS", "OGG signature mismatch")
        return "audio/ogg"
    end
    error("Unsupported pack asset type")
end

local BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local function base64_encode(data)
    return ((data:gsub('.', function(x)
        local r, byte = '', x:byte()
        for i = 8, 1, -1 do r = r .. (byte % 2^i - byte % 2^(i-1) > 0 and '1' or '0') end
        return r
    end) .. '0000'):gsub('%d%d%d?%d?%d?%d?', function(x)
        if #x < 6 then return '' end
        local c = 0
        for i = 1, 6 do c = c + (x:sub(i,i) == '1' and 2^(6-i) or 0) end
        return BASE64:sub(c+1,c+1)
    end) .. ({ '', '==', '=' })[#data % 3 + 1])
end

local function valid_semverish(value)
    if type(value) ~= "string" or #value < 5 or #value > 40 then return false end
    local candidate = value:sub(1, 1) == "v" and value:sub(2) or value
    local major, minor, patch, suffix = candidate:match("^(%d+)%.(%d+)%.(%d+)(.*)$")
    if not major or not minor or not patch then return false end
    if suffix == "" then return true end
    if suffix:sub(1, 1) ~= "-" and suffix:sub(1, 1) ~= "+" then return false end
    return #suffix > 1 and suffix:sub(2):match("^[%w%.%-]+$") ~= nil
end

local function read_manifest_from(path)
    local text = read_binary(path, MAX_MANIFEST_BYTES)
    local manifest, err = json.safe.decode(text)
    assert(manifest, "Invalid manifest.json: " .. tostring(err))
    local allowed_fields = { manifestVersion=true, id=true, name=true, version=true, author=true, description=true, license=true, homepage=true, tags=true, accentColor=true, attribution=true, type=true, minSteamTrophiesVersion=true, assets=true, customTrophies=true, sounds=true, preview=true, recommendedFor=true }
    for key, _ in pairs(manifest) do assert(allowed_fields[key], "Unknown pack manifest field: " .. tostring(key)) end
    assert(manifest.manifestVersion == 1, "Unsupported manifest version")
    assert(manifest.type == "trophy-icon-pack", "Unsupported pack type")
    assert(valid_pack_id(manifest.id), "Invalid or reserved pack id")
    assert(type(manifest.name) == "string" and #manifest.name >= 1 and #manifest.name <= 80, "Invalid pack name")
    assert(valid_semverish(manifest.version), "Invalid pack semantic version")
    assert(type(manifest.author) == "string" and #manifest.author >= 1 and #manifest.author <= 80, "Invalid pack author")
    if manifest.description ~= nil then assert(type(manifest.description) == "string" and #manifest.description <= 500, "Invalid pack description") end
    if manifest.license ~= nil then assert(type(manifest.license) == "string" and #manifest.license <= 120, "Invalid pack license") end
    if manifest.minSteamTrophiesVersion ~= nil then assert(type(manifest.minSteamTrophiesVersion) == "string" and #manifest.minSteamTrophiesVersion <= 40, "Invalid minimum SteamTrophies version") end
    if manifest.homepage ~= nil then assert(type(manifest.homepage) == "string" and #manifest.homepage <= 300 and manifest.homepage:match("^https://"), "Pack homepage must be https") end
    if manifest.tags ~= nil then
        assert(type(manifest.tags) == "table" and #manifest.tags <= 12, "Invalid pack tags")
        for _, tag in ipairs(manifest.tags) do assert(type(tag) == "string" and #tag >= 1 and #tag <= 32, "Invalid pack tag") end
    end
    if manifest.accentColor ~= nil then assert(type(manifest.accentColor) == "string" and manifest.accentColor:match("^#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]$"), "Invalid accentColor") end
    if manifest.attribution ~= nil then assert(type(manifest.attribution) == "string" and #manifest.attribution <= 300, "Invalid attribution") end
    if manifest.recommendedFor ~= nil then
        assert(type(manifest.recommendedFor) == "table" and #manifest.recommendedFor <= 3, "Invalid recommendedFor")
        for _, surface in ipairs(manifest.recommendedFor) do assert(surface == "desktop" or surface == "big_picture" or surface == "deck", "Invalid recommended surface") end
    end
    assert(type(manifest.assets) == "table", "Missing pack assets")
    local allowed_asset_keys = { ["trophy.bronze"]=true, ["trophy.silver"]=true, ["trophy.gold"]=true, ["trophy.platinum"]=true }
    for key, _ in pairs(manifest.assets) do assert(allowed_asset_keys[key], "Unknown pack asset key: " .. tostring(key)) end
    for _, key in ipairs(REQUIRED_KEYS) do
        local rel = normalize_relative(manifest.assets[key])
        assert(allowed_asset_extension(rel), "User trophy assets must be PNG, JPEG, or WebP")
        manifest.assets[key] = rel
    end
    if manifest.customTrophies ~= nil then
        assert(type(manifest.customTrophies) == "table", "customTrophies must be an object")
        local custom_count = 0
        for key, value in pairs(manifest.customTrophies) do
            custom_count = custom_count + 1
            assert(custom_count <= 48, "Too many custom trophy icons")
            assert(type(key) == "string" and key:match("^custom%.[a-z0-9][a-z0-9%._%-]*$") and #key <= 71, "Invalid custom trophy key")
            local rel = normalize_relative(value)
            assert(allowed_asset_extension(rel), "Custom trophy assets must be PNG, JPEG, or WebP")
            manifest.customTrophies[key] = rel
        end
    end
    if manifest.sounds ~= nil then
        assert(type(manifest.sounds) == "table", "sounds must be an object")
        local allowed_sounds = { ["toast.bronze"]=true, ["toast.silver"]=true, ["toast.gold"]=true, ["toast.platinum"]=true }
        for key, value in pairs(manifest.sounds) do
            assert(allowed_sounds[key], "Unknown pack sound key")
            local rel = normalize_relative(value)
            assert(allowed_audio_extension(rel), "Pack sounds must be WAV or OGG")
            manifest.sounds[key] = rel
        end
    end
    if manifest.preview ~= nil then
        manifest.preview = normalize_relative(manifest.preview)
        assert(allowed_asset_extension(manifest.preview), "Pack preview must be PNG, JPEG, or WebP")
    end
    return manifest, text
end

local function validate_source_directory(source_path)
    assert(type(source_path) == "string" and #source_path > 0 and #source_path <= 4096, "Invalid source path")
    assert(fs.is_directory(source_path), "Selected pack path is not a directory")
    assert(not fs.is_symlink(source_path), "Pack directory cannot be a symlink")
    local canonical, canonical_err = fs.canonical(source_path)
    assert(canonical, "Unable to resolve selected directory: " .. tostring(canonical_err))

    local manifest_path = fs.join(canonical, "manifest.json")
    assert(fs.is_file(manifest_path), "Pack folder must contain manifest.json")
    assert(not fs.is_symlink(manifest_path), "manifest.json cannot be a symlink")
    local manifest, manifest_text = read_manifest_from(manifest_path)

    local entries, list_err = fs.list_recursive(canonical)
    assert(entries, "Unable to inspect pack: " .. tostring(list_err))
    assert(#entries <= MAX_FILES, "Pack contains too many files")
    local total = 0
    local by_relative = {}
    local declared = { ["manifest.json"] = true }
    for _, key in ipairs(REQUIRED_KEYS) do declared[manifest.assets[key]] = true end
    if manifest.customTrophies then for _, rel in pairs(manifest.customTrophies) do declared[rel] = true end end
    if manifest.sounds then for _, rel in pairs(manifest.sounds) do declared[rel] = true end end
    if manifest.preview then declared[manifest.preview] = true end
    for _, entry in ipairs(entries) do
        assert(not entry.is_symlink, "Symlinks are forbidden inside packs")
        local relative, relative_err = fs.relative(entry.path, canonical)
        assert(relative, "Unable to normalize pack path: " .. tostring(relative_err))
        relative = normalize_relative(relative)
        if entry.is_file then
            assert(declared[relative], "Pack contains an undeclared file: " .. relative)
            assert(relative == "manifest.json" or allowed_asset_extension(relative) or allowed_audio_extension(relative), "Unexpected file type in pack: " .. relative)
            local size = entry.size or fs.file_size(entry.path) or 0
            total = total + size
            assert(total <= MAX_TOTAL_BYTES, "Pack exceeds total size limit")
            by_relative[relative] = entry.path
        end
    end

    for _, key in ipairs(REQUIRED_KEYS) do
        local rel = manifest.assets[key]
        local full = by_relative[rel]
        assert(full and fs.is_file(full), "Manifest asset is missing: " .. rel)
        local bytes = read_binary(full, MAX_ASSET_BYTES)
        mime_for_bytes(full, bytes)
    end
    if manifest.customTrophies then
        for _, rel in pairs(manifest.customTrophies) do
            local full = by_relative[rel]
            assert(full and fs.is_file(full), "Custom trophy asset is missing: " .. rel)
            mime_for_bytes(full, read_binary(full, MAX_ASSET_BYTES))
        end
    end
    if manifest.sounds then
        for _, rel in pairs(manifest.sounds) do
            local full = by_relative[rel]
            assert(full and fs.is_file(full), "Pack sound is missing: " .. rel)
            mime_for_bytes(full, read_binary(full, MAX_ASSET_BYTES))
        end
    end
    if manifest.preview then
        local preview = by_relative[manifest.preview]
        assert(preview and fs.is_file(preview), "Pack preview is missing")
        mime_for_bytes(preview, read_binary(preview, MAX_ASSET_BYTES))
    end
    return canonical, manifest, manifest_text, entries
end

local function write_text(path, text)
    local handle, err = io.open(path, "wb")
    assert(handle, "Unable to write pack metadata: " .. tostring(err))
    local ok, write_err = handle:write(text)
    handle:close()
    assert(ok, "Unable to write pack metadata: " .. tostring(write_err))
end

function M.import_directory(source_path, replace_existing)
    ensure_root()
    local canonical, manifest, manifest_text, entries = validate_source_directory(source_path)
    local destination = fs.join(pack_root(), manifest.id)
    if fs.exists(destination) and not replace_existing then error("A pack with this id is already installed") end

    sequence = sequence + 1
    local staging = fs.join(pack_root(), ".staging-" .. manifest.id .. "-" .. tostring(sequence))
    local backup = fs.join(pack_root(), ".backup-" .. manifest.id .. "-" .. tostring(sequence))
    pcall(fs.remove_all, staging)
    pcall(fs.remove_all, backup)
    local ok, err = fs.create_directories(staging)
    assert(ok or fs.is_directory(staging), "Unable to create pack staging directory: " .. tostring(err))

    local copied = 0
    for _, entry in ipairs(entries) do
        local relative = normalize_relative(assert(fs.relative(entry.path, canonical)))
        local target = fs.join(staging, relative)
        if entry.is_directory then
            local mkdir_ok, mkdir_err = fs.create_directories(target)
            assert(mkdir_ok or fs.is_directory(target), "Unable to stage pack directory: " .. tostring(mkdir_err))
        elseif entry.is_file then
            assert(not fs.is_symlink(entry.path), "Pack changed during import; symlink detected")
            local parent_ok, parent_err = fs.create_directories(fs.parent_path(target))
            assert(parent_ok or fs.is_directory(fs.parent_path(target)), "Unable to create staged asset directory: " .. tostring(parent_err))
            local copy_ok, copy_err = fs.copy(entry.path, target, false)
            assert(copy_ok, "Unable to stage pack file: " .. tostring(copy_err))
            copied = copied + 1
        end
    end
    assert(copied >= 5, "Pack staging unexpectedly incomplete")
    write_text(fs.join(staging, "manifest.json"), manifest_text)
    -- Validate the isolated staged copy again before promotion. This catches source mutation/copy corruption.
    validate_source_directory(staging)
    write_text(fs.join(staging, ".stt-install.json"), assert(json.safe.encode({ originalSourcePath = canonical, importedAtUnix = os.time() })))

    local had_existing = fs.exists(destination)
    if had_existing then
        local moved, move_err = fs.rename(destination, backup, false)
        assert(moved, "Unable to stage previous pack version: " .. tostring(move_err))
    end
    local promoted, promote_err = fs.rename(staging, destination, false)
    if not promoted then
        if had_existing and fs.exists(backup) then pcall(fs.rename, backup, destination, false) end
        pcall(fs.remove_all, staging)
        error("Unable to promote imported pack: " .. tostring(promote_err))
    end
    pcall(fs.remove_all, backup)
    return {
        manifest = manifest,
        source = "user",
        installedPath = destination,
        originalSourcePath = canonical,
        importedAtUnix = os.time(),
    }
end

local function installed_pack_record(path)
    if not fs.is_directory(path) or fs.is_symlink(path) then return nil end
    local name = fs.filename(path)
    if name:match("^%.") then return nil end
    local manifest_path = fs.join(path, "manifest.json")
    if not fs.is_file(manifest_path) then return nil end
    local ok, manifest = pcall(function() return select(1, read_manifest_from(manifest_path)) end)
    if not ok then return nil end
    local metadata = nil
    local metadata_path = fs.join(path, ".stt-install.json")
    if fs.is_file(metadata_path) then
        local text = read_binary(metadata_path, MAX_MANIFEST_BYTES)
        metadata = json.safe.decode(text)
    end
    return {
        manifest = manifest,
        source = "user",
        installedPath = path,
        originalSourcePath = metadata and metadata.originalSourcePath or nil,
        importedAtUnix = metadata and metadata.importedAtUnix or nil,
    }
end

function M.list_installed()
    ensure_root()
    local entries = fs.list(pack_root()) or {}
    local result = {}
    for _, entry in ipairs(entries) do
        if entry.is_directory then
            local record = installed_pack_record(entry.path)
            if record then table.insert(result, record) end
        end
    end
    table.sort(result, function(a, b) return a.manifest.name:lower() < b.manifest.name:lower() end)
    return result
end

local function manifest_allows_path(manifest, relative)
    if manifest.preview == relative then return true end
    for _, key in ipairs(REQUIRED_KEYS) do if manifest.assets[key] == relative then return true end end
    if manifest.customTrophies then for _, path in pairs(manifest.customTrophies) do if path == relative then return true end end end
    if manifest.sounds then for _, path in pairs(manifest.sounds) do if path == relative then return true end end end
    return false
end

function M.asset_data_url(pack_id, relative_path)
    assert(valid_pack_id(pack_id), "Invalid pack id")
    local relative = normalize_relative(relative_path)
    local pack_path = fs.join(pack_root(), pack_id)
    local manifest = select(1, read_manifest_from(fs.join(pack_path, "manifest.json")))
    assert(manifest.id == pack_id, "Pack id/path mismatch")
    assert(manifest_allows_path(manifest, relative), "Asset is not declared by this pack")
    local full = fs.join(pack_path, relative)
    assert(not fs.is_symlink(full), "Pack assets cannot be symlinks")
    local bytes = read_binary(full, MAX_ASSET_BYTES)
    local mime = mime_for_bytes(full, bytes)
    return "data:" .. mime .. ";base64," .. base64_encode(bytes)
end

function M.bundled_asset_data_url(relative_path)
    assert(type(relative_path) == "string" and #relative_path <= 240, "Invalid bundled asset path")
    local trophy_tier = relative_path:match("^resources/packs/[a-z0-9_%-]+/trophies/([a-z]+)%.svg$")
    local sound_tier = relative_path:match("^resources/packs/[a-z0-9_%-]+/sounds/([a-z]+)%.wav$")
    local tier = trophy_tier or sound_tier
    assert(tier == "bronze" or tier == "silver" or tier == "gold" or tier == "platinum", "Bundled resource path not allowed")
    local bytes = millennium.assets.read(relative_path)
    assert(type(bytes) == "string" and #bytes <= 512 * 1024, "Bundled resource unavailable or oversized")
    local mime = trophy_tier and "image/svg+xml" or "audio/wav"
    return "data:" .. mime .. ";base64," .. base64_encode(bytes)
end

function M.get_pack_directory(pack_id)
    assert(valid_pack_id(pack_id), "Invalid pack id")
    local path = fs.join(pack_root(), pack_id)
    assert(fs.is_directory(path), "Pack is not installed")
    return path
end

function M.remove(pack_id)
    assert(valid_pack_id(pack_id), "Invalid pack id")
    local path = fs.join(pack_root(), pack_id)
    if not fs.exists(path) then return false end
    local count, err = fs.remove_all(path)
    assert(count, "Unable to remove pack: " .. tostring(err))
    return true
end

return M

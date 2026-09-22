import re

def patch_sanitize():
    file_path = "google_apps_script_agendamento.js"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    old_sanitize = """function sanitizeUpper(obj) {
  if (!obj || typeof obj !== "object") return obj;
  var clean = {};
  for (var key in obj) {
    if (typeof obj[key] === "string") {
      if (key.toLowerCase().includes("email")) {
        clean[key] = obj[key].trim().toLowerCase();
      } else {
        clean[key] = obj[key].trim().toUpperCase();
      }
    } else if (Array.isArray(obj[key])) {
      clean[key] = obj[key].map(function(item) {
        return typeof item === "string" ? item.trim().toUpperCase() : item;
      });
    } else {
      clean[key] = obj[key];
    }
  }
  return clean;
}"""

    new_sanitize = """function sanitizeUpper(obj) {
  if (!obj || typeof obj !== "object") return obj;
  var clean = {};
  for (var key in obj) {
    if (typeof obj[key] === "string") {
      var keyLower = key.toLowerCase();
      if (keyLower.includes("email")) {
        clean[key] = obj[key].trim().toLowerCase();
      } else if (keyLower.includes("base64") || keyLower.includes("pdf")) {
        clean[key] = obj[key]; // Do not uppercase base64
      } else {
        clean[key] = obj[key].trim().toUpperCase();
      }
    } else if (Array.isArray(obj[key])) {
      clean[key] = obj[key].map(function(item) {
        return typeof item === "string" ? item.trim().toUpperCase() : item;
      });
    } else {
      clean[key] = obj[key];
    }
  }
  return clean;
}"""

    if old_sanitize in content:
        content = content.replace(old_sanitize, new_sanitize)
    else:
        # try regex fallback since indentation might differ
        content = re.sub(
            r'function sanitizeUpper\(obj\) \{[\s\S]*?return clean;\n\}',
            new_sanitize,
            content
        )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    patch_sanitize()

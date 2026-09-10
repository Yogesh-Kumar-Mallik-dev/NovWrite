use tauri::Manager;

fn should_enable_decorations() -> bool {
    #[cfg(target_os = "windows")]
    {
        // Windows standard layout: native titlebar with min/max/close controls
        true
    }

    #[cfg(target_os = "macos")]
    {
        // macOS standard layout: native titlebar with top-left traffic lights
        true
    }

    #[cfg(target_os = "linux")]
    {
        // Explicit override if user specifies NOVWRITE_DECORATIONS
        if let Ok(val) = std::env::var("NOVWRITE_DECORATIONS") {
            return val == "1" || val.eq_ignore_ascii_case("true");
        }

        // Detect Omarchy / Hyprland / Sway / Tiling Window Managers
        if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok()
            || std::env::var("SWAYSOCK").is_ok()
            || std::env::var("I3SOCK").is_ok()
            || std::env::var("OMARCHY").is_ok()
        {
            return false;
        }

        let xdg_desktop = std::env::var("XDG_CURRENT_DESKTOP")
            .unwrap_or_default()
            .to_lowercase();
        let desktop_session = std::env::var("DESKTOP_SESSION")
            .unwrap_or_default()
            .to_lowercase();
        let session_desktop = std::env::var("XDG_SESSION_DESKTOP")
            .unwrap_or_default()
            .to_lowercase();

        let tiling_indicators = [
            "hyprland",
            "omarchy",
            "sway",
            "i3",
            "bspwm",
            "river",
            "awesome",
            "dwm",
            "xmonad",
            "qtile",
            "herbstluftwm",
            "leftwm",
            "wayfire",
        ];

        for indicator in &tiling_indicators {
            if xdg_desktop.contains(indicator)
                || desktop_session.contains(indicator)
                || session_desktop.contains(indicator)
            {
                // Omarchy & Tiling WMs: Frameless without titlebar or min/max/close buttons
                return false;
            }
        }

        // Standard Linux Floating Desktop Environments (GNOME, KDE, XFCE, Cinnamon, MATE)
        true
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        true
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let enable_decorations = should_enable_decorations();
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_decorations(enable_decorations);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running NovWrite desktop application");
}


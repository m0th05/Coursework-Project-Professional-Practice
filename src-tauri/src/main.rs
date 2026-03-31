#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cairo::surface::content;
use serde::Serialize;
use std::fs;
use std::sync::Mutex;
use tauri::State;

mod core;
use crate::core::{ActionEvent, Actions, AttoCore};

struct AttoState {
    core: Mutex<AttoCore>,
}

#[derive(Serialize)]
struct AttoSnapshot {
    buffer: Vec<String>,
    cursor_x: usize,
    cursor_y: usize,
    mode: String,
    event: String,
}

#[tauri::command]
fn save(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn load(path: String, state: State<AttoState>) -> Result<AttoSnapshot, String> {
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut atto = state.core.lock().unwrap();

    atto.buffer = if content.is_empty() {
        vec![String::new()]
    } else {
        content.lines().map(|line| line.to_string()).collect()
    };

    Ok(AttoSnapshot {
        buffer: atto.buffer.clone(),
        cursor_x: atto.cursor_x,
        cursor_y: atto.cursor_y,
        mode: format!("{:?}", atto.mode),
        event: "none".to_string(),
    })
}

#[tauri::command]
fn atto_action(action: String, payload: Option<String>, state: State<AttoState>) -> AttoSnapshot {
    let mut atto = state.core.lock().unwrap();

    let parsed = match action.as_str() {
        "insert_char" => payload
            .and_then(|s| s.chars().next())
            .map(Actions::InsertChar),
        "new_line" => Some(Actions::NewLine),
        "backspace" => Some(Actions::Backspace),
        "move_right" => Some(Actions::MoveRight),
        "move_left" => Some(Actions::MoveLeft),
        "move_up" => Some(Actions::MoveUp),
        "move_down" => Some(Actions::MoveDown),
        "insert_tab" => Some(Actions::InsertTab),
        _ => None,
    };

    let event = if let Some(action) = parsed {
        atto.apply(action)
    } else {
        ActionEvent::None
    };

    AttoSnapshot {
        buffer: atto.buffer.clone(),
        cursor_x: atto.cursor_x,
        cursor_y: atto.cursor_y,
        mode: format!("{:?}", atto.mode),
        event: "none".to_string(),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AttoState {
            core: Mutex::new(AttoCore::new()),
        })
        .invoke_handler(tauri::generate_handler![atto_action, save, load])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

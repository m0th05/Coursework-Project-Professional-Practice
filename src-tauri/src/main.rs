#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::State;

mod core;
use crate::core::{Actions, AttoCore};

struct AttoState {
    core: Mutex<AttoCore>,
}

#[tauri::command]
fn atto_action(action: String, payload: Option<String>, state: State<AttoState>) -> Option<String> {
    let mut atto = state.core.lock().unwrap();

    match action.as_str() {
        "insert_char" => {
            if let Some(c) = payload.and_then(|s| s.chars().next()) {
                atto.apply(Actions::InsertChar(c));
            }
            None
        }

        "move_left" => {
            atto.apply(Actions::MoveLeft);
            None
        }

        "move_right" => {
            atto.apply(Actions::MoveRight);
            None
        }

        "get_buffer" => Some(atto.buffer.join("\n")),

        _ => None,
    }
}

fn main() {
    tauri::Builder::default()
        .manage(AttoState {
            core: Mutex::new(AttoCore::new()),
        })
        .invoke_handler(tauri::generate_handler![atto_action])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

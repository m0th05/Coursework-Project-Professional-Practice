use std::io;

#[derive(Debug)]
pub enum Mode {
    Normal,
    Insert,
    Command,
}

pub struct SyntaxRules {
    keywords: Vec<String>,
    comment_markers: Vec<String>,
    highlight_numbers: bool,
}

pub enum Actions {
    InsertChar(char),
    NewLine,
    Backspace,
    MoveLeft,
    MoveRight,
    MoveUp,
    MoveDown,
    InsertTab,
    EnterInsert,
    ExitInsert,
    StartCommand,
    CommandChar(char),
    ExecuteCommand,
}

pub enum ActionEvent {
    None,
    QuitRequested,
    SaveRequested,
}

pub struct AttoCore {
    pub buffer: Vec<String>,
    pub cursor_x: usize,
    pub cursor_y: usize,
    pub mode: Mode,
    command_input: String,
    selection_start: Option<(usize, usize)>,
    syntax: SyntaxRules,
}

impl AttoCore {
    pub fn new() -> Self {
        Self {
            buffer: vec![String::new()],
            cursor_x: 0,
            cursor_y: 0,
            mode: Mode::Insert,
            command_input: String::new(),
            selection_start: None,
            syntax: SyntaxRules {
                keywords: vec![],
                comment_markers: vec![],
                highlight_numbers: true,
            },
        }
    }

    fn execute_command(&mut self) -> ActionEvent {
        let cmd = self.command_input.trim().to_string();
        self.command_input.clear();
        self.mode = Mode::Normal;

        match cmd.as_str() {
            "q" | ":q" => ActionEvent::QuitRequested,
            "w" | ":w" => ActionEvent::SaveRequested,
            "wq" | ":wq" => ActionEvent::QuitRequested,
            _ => ActionEvent::None,
        }
    }

    fn insert_char(&mut self, c: char) {
        self.buffer[self.cursor_y].insert(self.cursor_x, c);
        self.cursor_x += 1;
    }

    fn new_line(&mut self) {
        let remainder = self.buffer[self.cursor_y].split_off(self.cursor_x);
        self.buffer.insert(self.cursor_y + 1, remainder);
        self.cursor_y += 1;
        self.cursor_x = 0;
    }

    fn backspace(&mut self) {
        if self.cursor_x > 0 {
            self.cursor_x -= 1;
            self.buffer[self.cursor_y].remove(self.cursor_x);
        } else if self.cursor_y > 0 {
            let line = self.buffer.remove(self.cursor_y);
            self.cursor_y -= 1;
            self.cursor_x = self.buffer[self.cursor_y].len();
            self.buffer[self.cursor_y].push_str(&line);
        }
    }

    fn move_left(&mut self) {
        if self.cursor_x > 0 {
            self.cursor_x -= 1;
        } else if self.cursor_y > 0 {
            self.cursor_y -= 1;
            self.cursor_x = self.buffer[self.cursor_y].len();
        }
    }

    fn move_right(&mut self) {
        if self.cursor_x < self.buffer[self.cursor_y].len() {
            self.cursor_x += 1;
        } else if self.cursor_y + 1 < self.buffer.len() {
            self.cursor_y += 1;
            self.cursor_x = 0;
        }
    }

    fn move_up(&mut self) {
        if self.cursor_y > 0 {
            self.cursor_y -= 1;
            self.cursor_x = self.cursor_x.min(self.buffer[self.cursor_y].len());
        }
    }

    fn move_down(&mut self) {
        if self.cursor_y + 1 < self.buffer.len() {
            self.cursor_y += 1;
            self.cursor_x = self.cursor_x.min(self.buffer[self.cursor_y].len());
        }
    }

    fn insert_tab(&mut self) {
        // this is for later when i can actually test this
        for _ in 0..4 {
            self.buffer[self.cursor_y].insert(self.cursor_x, ' ');
            self.cursor_x += 1;
        }
    }

    pub fn apply(&mut self, action: Actions) -> ActionEvent {
        match action {
            Actions::InsertChar(c) if matches!(self.mode, Mode::Insert) => self.insert_char(c),
            Actions::NewLine if matches!(self.mode, Mode::Insert) => self.new_line(),

            Actions::Backspace => self.backspace(),
            Actions::MoveLeft => self.move_left(),
            Actions::MoveRight => self.move_right(),
            Actions::MoveUp => self.move_up(),
            Actions::MoveDown => self.move_down(),
            Actions::InsertTab => self.insert_tab(),

            Actions::EnterInsert => self.mode = Mode::Insert,
            Actions::ExitInsert => self.mode = Mode::Normal,

            Actions::StartCommand => {
                self.mode = Mode::Command;
                self.command_input.clear();
            }

            Actions::CommandChar(c) if matches!(self.mode, Mode::Command) => {
                self.command_input.push(c);
            }

            Actions::ExecuteCommand => return self.execute_command(),

            _ => {}
        }

        ActionEvent::None
    }
}

use std::fs;
use std::path::Path;

pub struct FileManager;

impl FileManager {
    pub fn new() -> Self {
        Self
    }

    pub fn read_file<P: AsRef<Path>>(&self, path: P) -> anyhow::Result<String> {
        Ok(fs::read_to_string(path)?)
    }

    pub fn write_file<P: AsRef<Path>>(&self, path: P, content: &str) -> anyhow::Result<()> {
        fs::write(path, content)?;
        Ok(())
    }

    pub fn list_directory<P: AsRef<Path>>(&self, path: P) -> anyhow::Result<Vec<String>> {
        let entries: Vec<String> = fs::read_dir(path)?
            .filter_map(|entry| {
                entry.ok().map(|e| e.path().display().to_string())
            })
            .collect();
        Ok(entries)
    }
}
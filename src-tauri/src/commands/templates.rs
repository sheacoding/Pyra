use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[derive(Serialize, Deserialize, Clone)]
pub struct ProjectTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub files: Vec<TemplateFile>,
    pub dependencies: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TemplateFile {
    pub path: String,
    pub content: String,
    pub is_directory: bool,
}

// Built-in project templates
fn get_builtin_templates() -> Vec<ProjectTemplate> {
    vec![
        ProjectTemplate {
            id: "basic".to_string(),
            name: "Basic Python Project".to_string(),
            description: "A simple Python project with main.py".to_string(),
            category: "General".to_string(),
            files: vec![
                TemplateFile {
                    path: "main.py".to_string(),
                    content: r#"#!/usr/bin/env python3
"""
Basic Python Project
"""

def main():
    print("Hello, World!")
    print("Welcome to your new Python project!")

if __name__ == "__main__":
    main()
"#.to_string(),
                    is_directory: false,
                },
                TemplateFile {
                    path: "README.md".to_string(),
                    content: r#"# Python Project

A basic Python project created with Pyra IDE.

## Getting Started

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Run the project:
   ```bash
   uv run python main.py
   ```

## Project Structure

- `main.py` - Main application entry point
- `pyproject.toml` - Project configuration and dependencies
"#.to_string(),
                    is_directory: false,
                },
            ],
            dependencies: vec![],
        },
        
        ProjectTemplate {
            id: "cli-app".to_string(),
            name: "CLI Application".to_string(),
            description: "Command-line application with argparse".to_string(),
            category: "Applications".to_string(),
            files: vec![
                TemplateFile {
                    path: "main.py".to_string(),
                    content: r#"#!/usr/bin/env python3
"""
CLI Application Template
"""

import argparse
import sys
from typing import Optional

def main() -> int:
    """Main entry point for the CLI application."""
    parser = argparse.ArgumentParser(
        description="CLI Application created with Pyra IDE"
    )
    parser.add_argument(
        "--version", 
        action="version", 
        version="%(prog)s 1.0.0"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "command",
        nargs="?",
        default="hello",
        help="Command to execute (default: hello)"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        print(f"Executing command: {args.command}")
    
    if args.command == "hello":
        print("Hello from your CLI application!")
        return 0
    else:
        print(f"Unknown command: {args.command}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
"#.to_string(),
                    is_directory: false,
                },
                TemplateFile {
                    path: "README.md".to_string(),
                    content: r#"# CLI Application

A command-line application template created with Pyra IDE.

## Features

- Argument parsing with argparse
- Help documentation
- Version information
- Verbose output option

## Usage

```bash
# Show help
uv run python main.py --help

# Run with default command
uv run python main.py

# Run with verbose output
uv run python main.py -v hello

# Show version
uv run python main.py --version
```
"#.to_string(),
                    is_directory: false,
                },
            ],
            dependencies: vec![],
        },
        
        ProjectTemplate {
            id: "web-api".to_string(),
            name: "FastAPI Web API".to_string(),
            description: "REST API with FastAPI framework".to_string(),
            category: "Web".to_string(),
            files: vec![
                TemplateFile {
                    path: "main.py".to_string(),
                    content: r#"""
FastAPI Web API Template
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn

app = FastAPI(
    title="My API",
    description="A FastAPI application created with Pyra IDE",
    version="1.0.0"
)

# Data models
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

# In-memory storage (replace with database in production)
items_db: Dict[int, Item] = {}
next_id = 1

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to your FastAPI application!"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.get("/items", response_model=List[Item])
async def get_items():
    """Get all items."""
    return list(items_db.values())

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get a specific item by ID."""
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    return items_db[item_id]

@app.post("/items", response_model=Item)
async def create_item(item: ItemCreate):
    """Create a new item."""
    global next_id
    new_item = Item(id=next_id, **item.dict())
    items_db[next_id] = new_item
    next_id += 1
    return new_item

@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, item: ItemCreate):
    """Update an existing item."""
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = Item(id=item_id, **item.dict())
    items_db[item_id] = updated_item
    return updated_item

@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    """Delete an item."""
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    
    del items_db[item_id]
    return {"message": "Item deleted successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
"#.to_string(),
                    is_directory: false,
                },
                TemplateFile {
                    path: "requirements.txt".to_string(),
                    content: r#"fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.4.0
"#.to_string(),
                    is_directory: false,
                },
                TemplateFile {
                    path: "README.md".to_string(),
                    content: r#"# FastAPI Web API

A REST API application built with FastAPI.

## Features

- RESTful API endpoints
- Automatic API documentation (Swagger UI)
- Request/response validation with Pydantic
- CRUD operations for items

## Getting Started

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Run the server:
   ```bash
   uv run python main.py
   ```

3. Open your browser and visit:
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /items` - Get all items
- `GET /items/{id}` - Get item by ID
- `POST /items` - Create new item
- `PUT /items/{id}` - Update item
- `DELETE /items/{id}` - Delete item
"#.to_string(),
                    is_directory: false,
                },
            ],
            dependencies: vec![
                "fastapi>=0.104.0".to_string(),
                "uvicorn[standard]>=0.24.0".to_string(),
                "pydantic>=2.4.0".to_string(),
            ],
        },
        
        ProjectTemplate {
            id: "data-analysis".to_string(),
            name: "Data Analysis".to_string(),
            description: "Data science project with pandas and matplotlib".to_string(),
            category: "Data Science".to_string(),
            files: vec![
                TemplateFile {
                    path: "data/".to_string(),
                    content: "".to_string(),
                    is_directory: true,
                },
                TemplateFile {
                    path: "notebooks/".to_string(),
                    content: "".to_string(),
                    is_directory: true,
                },
                TemplateFile {
                    path: "src/".to_string(),
                    content: "".to_string(),
                    is_directory: true,
                },
                TemplateFile {
                    path: "main.py".to_string(),
                    content: r#"""
Data Analysis Project Template
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

def load_sample_data() -> pd.DataFrame:
    """Create sample data for demonstration."""
    np.random.seed(42)
    
    # Generate sample sales data
    dates = pd.date_range('2023-01-01', periods=365, freq='D')
    sales = np.random.normal(1000, 200, 365) + \
            np.sin(np.arange(365) * 2 * np.pi / 7) * 100  # Weekly pattern
    
    data = pd.DataFrame({
        'date': dates,
        'sales': np.maximum(sales, 0),  # Ensure positive values
        'category': np.random.choice(['A', 'B', 'C'], 365),
        'region': np.random.choice(['North', 'South', 'East', 'West'], 365)
    })
    
    return data

def analyze_data(df: pd.DataFrame):
    """Perform basic data analysis."""
    print("📊 Data Analysis Results")
    print("=" * 50)
    
    # Basic statistics
    print("\n📈 Sales Statistics:")
    print(f"Total Sales: ${df['sales'].sum():,.2f}")
    print(f"Average Daily Sales: ${df['sales'].mean():,.2f}")
    print(f"Median Daily Sales: ${df['sales'].median():,.2f}")
    print(f"Sales Standard Deviation: ${df['sales'].std():.2f}")
    
    # Sales by category
    print("\n📋 Sales by Category:")
    category_sales = df.groupby('category')['sales'].sum().sort_values(ascending=False)
    for category, sales in category_sales.items():
        print(f"  {category}: ${sales:,.2f}")
    
    # Sales by region
    print("\n🗺️ Sales by Region:")
    region_sales = df.groupby('region')['sales'].sum().sort_values(ascending=False)
    for region, sales in region_sales.items():
        print(f"  {region}: ${sales:,.2f}")

def create_visualizations(df: pd.DataFrame):
    """Create data visualizations."""
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('Sales Data Analysis', fontsize=16)
    
    # Time series plot
    axes[0, 0].plot(df['date'], df['sales'])
    axes[0, 0].set_title('Daily Sales Trend')
    axes[0, 0].set_xlabel('Date')
    axes[0, 0].set_ylabel('Sales ($)')
    axes[0, 0].tick_params(axis='x', rotation=45)
    
    # Sales by category
    category_sales = df.groupby('category')['sales'].sum()
    axes[0, 1].bar(category_sales.index, category_sales.values)
    axes[0, 1].set_title('Sales by Category')
    axes[0, 1].set_xlabel('Category')
    axes[0, 1].set_ylabel('Total Sales ($)')
    
    # Sales by region
    region_sales = df.groupby('region')['sales'].sum()
    axes[1, 0].pie(region_sales.values, labels=region_sales.index, autopct='%1.1f%%')
    axes[1, 0].set_title('Sales Distribution by Region')
    
    # Sales histogram
    axes[1, 1].hist(df['sales'], bins=30, edgecolor='black', alpha=0.7)
    axes[1, 1].set_title('Sales Distribution')
    axes[1, 1].set_xlabel('Sales ($)')
    axes[1, 1].set_ylabel('Frequency')
    
    plt.tight_layout()
    
    # Save the plot
    output_dir = Path('outputs')
    output_dir.mkdir(exist_ok=True)
    plt.savefig(output_dir / 'sales_analysis.png', dpi=300, bbox_inches='tight')
    print(f"\n📈 Visualizations saved to {output_dir / 'sales_analysis.png'}")
    
    plt.show()

def main():
    """Main analysis workflow."""
    print("🐍 Data Analysis Project")
    print("=" * 50)
    
    # Load data
    print("\n📊 Loading sample data...")
    df = load_sample_data()
    print(f"Loaded {len(df)} records")
    
    # Analyze data
    analyze_data(df)
    
    # Create visualizations
    print("\n📈 Creating visualizations...")
    create_visualizations(df)
    
    # Save processed data
    output_dir = Path('outputs')
    output_dir.mkdir(exist_ok=True)
    df.to_csv(output_dir / 'processed_data.csv', index=False)
    print(f"\n💾 Processed data saved to {output_dir / 'processed_data.csv'}")

if __name__ == "__main__":
    main()
"#.to_string(),
                    is_directory: false,
                },
                TemplateFile {
                    path: "requirements.txt".to_string(),
                    content: r#"pandas>=2.1.0
matplotlib>=3.7.0
numpy>=1.24.0
seaborn>=0.12.0
jupyter>=1.0.0
"#.to_string(),
                    is_directory: false,
                },
                TemplateFile {
                    path: "README.md".to_string(),
                    content: r#"# Data Analysis Project

A data science project template with pandas, matplotlib, and numpy.

## Features

- Sample data generation
- Statistical analysis
- Data visualizations
- CSV export functionality
- Organized project structure

## Project Structure

```
├── data/          # Raw data files
├── notebooks/     # Jupyter notebooks
├── src/          # Source code modules
├── outputs/      # Generated outputs
├── main.py       # Main analysis script
└── requirements.txt
```

## Getting Started

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Run the analysis:
   ```bash
   uv run python main.py
   ```

3. Open Jupyter for interactive analysis:
   ```bash
   uv run jupyter notebook
   ```

## Features

- 📊 Statistical analysis
- 📈 Data visualizations
- 💾 Data export
- 🗂️ Organized structure
"#.to_string(),
                    is_directory: false,
                },
            ],
            dependencies: vec![
                "pandas>=2.1.0".to_string(),
                "matplotlib>=3.7.0".to_string(),
                "numpy>=1.24.0".to_string(),
                "seaborn>=0.12.0".to_string(),
                "jupyter>=1.0.0".to_string(),
            ],
        },
    ]
}

#[tauri::command]
pub async fn get_project_templates() -> Result<Vec<ProjectTemplate>, String> {
    Ok(get_builtin_templates())
}

#[tauri::command]
pub async fn create_project_from_template(
    project_path: String,
    template_id: String,
    project_name: String,
    python_version: Option<String>,
) -> Result<String, String> {
    let templates = get_builtin_templates();
    let template = templates
        .iter()
        .find(|t| t.id == template_id)
        .ok_or_else(|| format!("Template '{}' not found", template_id))?;

    // Create project directory
    let project_dir = Path::new(&project_path);
    if project_dir.exists() {
        // Check if directory is empty or only contains acceptable files
        let entries: Vec<_> = fs::read_dir(project_dir)
            .map_err(|e| format!("Failed to read project directory: {}", e))?
            .collect();
        
        let mut has_important_files = false;
        for entry in entries {
            if let Ok(entry) = entry {
                let file_name = entry.file_name();
                let name = file_name.to_string_lossy();
                // Allow certain files to be overwritten
                if !matches!(name.as_ref(), "pyproject.toml" | ".gitignore" | "README.md" | "requirements.txt") {
                    has_important_files = true;
                    break;
                }
            }
        }
        
        if has_important_files {
            return Err(format!("Directory '{}' already exists and contains files. Please choose an empty directory or different name.", project_path));
        }
        
        // Remove pyproject.toml if it exists to allow UV init to work
        let existing_pyproject = project_dir.join("pyproject.toml");
        if existing_pyproject.exists() {
            fs::remove_file(&existing_pyproject)
                .map_err(|e| format!("Failed to remove existing pyproject.toml: {}", e))?;
        }
    } else {
        fs::create_dir_all(project_dir)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;
    }

    // Create files from template
    for file in &template.files {
        let file_path = project_dir.join(&file.path);
        
        if file.is_directory {
            // Create directory
            fs::create_dir_all(&file_path)
                .map_err(|e| format!("Failed to create directory {}: {}", file.path, e))?;
        } else {
            // Create parent directory if needed
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory for {}: {}", file.path, e))?;
            }
            
            // Create file
            fs::write(&file_path, &file.content)
                .map_err(|e| format!("Failed to create file {}: {}", file.path, e))?;
        }
    }

    // Create pyproject.toml with UV configuration
    let pyproject_content = create_pyproject_toml(&project_name, &template.dependencies);
    let pyproject_path = project_dir.join("pyproject.toml");
    fs::write(&pyproject_path, pyproject_content)
        .map_err(|e| format!("Failed to create pyproject.toml: {}", e))?;

    // Create .gitignore
    let gitignore_content = create_gitignore();
    let gitignore_path = project_dir.join(".gitignore");
    fs::write(&gitignore_path, gitignore_content)
        .map_err(|e| format!("Failed to create .gitignore: {}", e))?;

    // Use UV to initialize the project with the specified Python version
    let mut uv_args = vec!["init", "--name", &project_name];
    if let Some(ref version) = python_version {
        uv_args.extend_from_slice(&["--python", version]);
    }

    let uv_init_result = Command::new("uv")
        .args(&uv_args)
        .current_dir(&project_dir)
        .output();

    let uv_success = match uv_init_result {
        Ok(output) if output.status.success() => {
            true
        }
        Ok(output) => {
            eprintln!("UV init warning: {}", String::from_utf8_lossy(&output.stderr));
            false
        }
        Err(e) => {
            eprintln!("UV not available: {}", e);
            false
        }
    };

    // If UV init failed, create a basic pyproject.toml manually
    if !uv_success {
        let fallback_pyproject = create_pyproject_toml(&project_name, &template.dependencies);
        let pyproject_path = project_dir.join("pyproject.toml");
        fs::write(&pyproject_path, fallback_pyproject)
            .map_err(|e| format!("Failed to create fallback pyproject.toml: {}", e))?;
    }

    // Install template dependencies if any
    if !template.dependencies.is_empty() {
        for dep in &template.dependencies {
            let add_result = Command::new("uv")
                .args(&["add", dep])
                .current_dir(&project_dir)
                .output();
            
            if let Err(e) = add_result {
                eprintln!("Warning: Failed to add dependency {}: {}", dep, e);
            } else if let Ok(add_output) = add_result {
                if !add_output.status.success() {
                    eprintln!("Warning: Failed to add dependency {}: {}", 
                        dep, String::from_utf8_lossy(&add_output.stderr));
                }
            }
        }

        // Sync the project to install dependencies
        let sync_result = Command::new("uv")
            .args(&["sync"])
            .current_dir(&project_dir)
            .output();

        if let Err(e) = sync_result {
            eprintln!("Warning: Failed to sync dependencies: {}", e);
        } else if let Ok(sync_output) = sync_result {
            if !sync_output.status.success() {
                eprintln!("Warning: Failed to sync dependencies: {}", 
                    String::from_utf8_lossy(&sync_output.stderr));
            }
        }
    }
    
    Ok(format!("Project '{}' created successfully from template '{}' with Python {}", 
        project_name, template.name, python_version.as_deref().unwrap_or("default")))
}

fn create_pyproject_toml(project_name: &str, dependencies: &[String]) -> String {
    let deps_str = if dependencies.is_empty() {
        String::new()
    } else {
        let formatted_deps: Vec<String> = dependencies
            .iter()
            .map(|dep| format!("    \"{}\"", dep))
            .collect();
        format!("dependencies = [\n{}\n]", formatted_deps.join(",\n"))
    };

    format!(
        r#"[project]
name = "{}"
version = "0.1.0"
description = "A Python project created with Pyra IDE"
authors = [
    {{name = "Your Name", email = "your.email@example.com"}}
]
readme = "README.md"
license = {{text = "MIT"}}
requires-python = ">=3.9"
{}

[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[tool.ruff]
line-length = 88
target-version = "py39"

[tool.ruff.lint]
select = [
    "E",  # pycodestyle errors
    "W",  # pycodestyle warnings  
    "F",  # pyflakes
    "I",  # isort
    "B",  # flake8-bugbear
    "C4", # flake8-comprehensions
    "UP", # pyupgrade
]
ignore = []

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
"#,
        project_name, deps_str
    )
}

fn create_gitignore() -> &'static str {
    r#"# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/

# Virtual environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Project specific
outputs/
logs/
*.log
"#
}
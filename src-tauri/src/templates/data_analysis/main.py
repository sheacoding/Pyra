"""
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
    print("Data Analysis Results")
    print("=" * 50)

    # Basic statistics
    print("\nSales Statistics:")
    print(f"Total Sales: ${df['sales'].sum():,.2f}")
    print(f"Average Daily Sales: ${df['sales'].mean():,.2f}")
    print(f"Median Daily Sales: ${df['sales'].median():,.2f}")
    print(f"Sales Standard Deviation: ${df['sales'].std():.2f}")

    # Sales by category
    print("\nSales by Category:")
    category_sales = df.groupby('category')['sales'].sum().sort_values(ascending=False)
    for category, sales in category_sales.items():
        print(f"  {category}: ${sales:,.2f}")

    # Sales by region
    print("\nSales by Region:")
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
    print(f"\nVisualizations saved to {output_dir / 'sales_analysis.png'}")

    plt.show()

def main():
    """Main analysis workflow."""
    print("Data Analysis Project")
    print("=" * 50)

    # Load data
    print("\nLoading sample data...")
    df = load_sample_data()
    print(f"Loaded {len(df)} records")

    # Analyze data
    analyze_data(df)

    # Create visualizations
    print("\nCreating visualizations...")
    create_visualizations(df)

    # Save processed data
    output_dir = Path('outputs')
    output_dir.mkdir(exist_ok=True)
    df.to_csv(output_dir / 'processed_data.csv', index=False)
    print(f"\nProcessed data saved to {output_dir / 'processed_data.csv'}")

if __name__ == "__main__":
    main()

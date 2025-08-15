import React, { useState } from "react";

const indicatorOptions = [
  "Real GDP",
  "Nominal GDP",
  "Industrial Production Index (Total)",
  "Industrial Production: Manufacturing",
  "Capacity Utilization: Total Industry",
  "Retail Sales (Total)",
  "Construction Spending: Total",
  "Business Inventories",
  "Unemployment Rate (National)",
  "Labor Force Participation Rate (National)",
  "Employment Level (National)",
  "Average Hourly Earnings: Total Private",
  "Job Openings: Total Nonfarm",
  "Consumer Price Index (CPI-U)",
  "Core CPI (Ex. Food & Energy)",
  "PCE Price Index",
  "Core PCE (Ex. Food & Energy)",
  "Producer Price Index: All Commodities",
  "Effective Federal Funds Rate",
  "10-Year Treasury Constant Maturity",
  "2-Year Treasury",
  "30-Year Fixed Rate Mortgage Average",
  "Prime Bank Loan Rate",
  "M2 Money Stock",
  "Consumer Loans: Credit Cards",
  "Commercial and Industrial Loans",
  "Bank Tightening Standards for C&I Loans",
  "U.S. Exports of Goods & Services",
  "U.S. Imports of Goods & Services",
  "Trade Balance",
  "Exchange Rate: U.S. Dollar Index",
  "Housing Starts (National)",
  "Building Permits (National)",
  "Median Sales Price of Houses (National)",
  "S&P/Case-Shiller U.S. National Home Price Index",
  "Real GDP by State",
  "Unemployment Rate by State",
  "Labor Force Participation Rate by State",
  "Employment Level by State"
];

const defaultSelected = [
  "Real GDP",
  "Nominal GDP",
  "Real GDP by State",
  "Unemployment Rate by State",
  "Unemployment Rate (National)"
];

export default function EconomicIndicatorsBox({ selectedIndicators, setSelectedIndicators }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(prev => !prev);

  const availableOptions = indicatorOptions.filter(opt => !selectedIndicators.includes(opt));

  const handleAdd = (event) => {
    const selected = Array.from(event.target.selectedOptions).map(o => o.value);
    const newIndicators = [...selectedIndicators, ...selected].slice(0, 6);
    setSelectedIndicators(newIndicators);
    setDropdownOpen(false);
  };

  const handleRemove = (labelToRemove) => {
    setSelectedIndicators(selectedIndicators.filter(label => label !== labelToRemove));
  };

  return (
    <div className="form-group">
      <label>Choosen Indicators (max 6):</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
        {selectedIndicators.map(label => (
          <span
            key={label}
            style={{
              backgroundColor: "gold",
              padding: "2px 2px",
              borderRadius: "12px",
              cursor: "pointer"
            }}
            onClick={() => handleRemove(label)}
            title="Click to Remove"
          >
            {label} ✕
          </span>
        ))}
      </div>

      {selectedIndicators.length < 6 && (
        <>
          <button type="button" onClick={toggleDropdown}>
            {dropdownOpen ? "Hide List" : "Add More"}
          </button>
          {dropdownOpen && (
            <select multiple onChange={handleAdd} size={120} style={{ marginTop: "8px", width: "100%",minHeight: "120px" }}>
              {availableOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </div>
  );
}

EconomicIndicatorsBox.defaultProps = {
  selectedIndicators: [...defaultSelected],
  setSelectedIndicators: () => {}
};


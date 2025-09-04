import React, { useState, useEffect } from "react";
import "./style.css";
import EconomicIndicatorsBox from "./EconomicIndicatorsBox";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import ReactMarkdown from 'react-markdown';

export default function App() {

  const { isSignedIn, user } = useUser();

  const [editablePrompt, setEditablePrompt] = useState(`**Company Performance Analysis**
  Industry Overview
  The company operates in the industry of women's clothing stores (NAICS code 448120). According to the U.S. Economic Census, the industry's CAGR from 2012 to 2017 was -0.028, and from 2017 to 2022, it was .56.
  
  **Company Performance**
  The company's sales data shows a declining trend, with a CAGR of -0.10 from 2017 to 2022. This is a concerning sign, as it indicates a decrease in sales over the past five years.
  
  **Expert Opinion**
  Greg Finance, our expert analyst, has predicted a 6% drop in sales due to tarrifs. 
  
  **Comparison to Industry Peers**
  We analyzed the 10-K reports of other companies in the industry, including Torrid Holdings Inc., Tapestry Inc., and Chico's FAS, Inc. These companies have reported revenue growth rates ranging from -0.00 to 0.03. In comparison, our company's sales decline is a significant concern.
  
  **Economic Indicators**
  At the state level, Florida's Real GDP has grown from 2023 to 2025, with a year-over-year growth rate of 0.028456581147295656 in 2025. The Unemployment Rate in Florida has also decreased from 2023 to 2025. Nationally, the Nominal GDP and Real GDP have both grown from 2023 to 2025, with year-over-year growth rates of 0.048573869948537185 and 0.02262176119973547, respectively. The Unemployment Rate has also decreased nationally from 2023 to 2025.
  
  **Budget vs Actuals Variance**
  The variance report shows significant differences between actual costs and budgeted costs, with variances ranging from -95.000 to 100.000000 in Development Costs, and -42.500 to 65.050 in Maintenance Cost.
  
  **Search Trends**
  The search trends for the company's name and keywords associated with the company indicate a decline in interest from 2020 to 2022, with a slight increase in 2023 and 2024. This could be a sign of declining brand awareness or relevance.
  
  **Conclusion**
  In conclusion, the company's performance is a concern, with declining sales and a significant gap between actual and budgeted costs. The industry peers have reported growth, and the economic indicators are positive, but the company's performance is not reflecting these trends. Immediate attention is required to address the expert's actions and to turnaround the company's sales and financial performance.`); 
  const [selectedPromptFormat, setSelectedPromptFormat] = useState("Default (Sectioned Report)");
  const [view, setView] = useState("main"); 
  const [selectedIndicators, setSelectedIndicators] = useState([
    "Real GDP",
    "Nominal GDP",
    "Real GDP by State",
    "Unemployment Rate by State",
    "Unemployment Rate (National)",
  ]);
  const [fredData, setFredData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [expertName, setExpertName] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [keywords, setKeywords] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cikInputs, setCikInputs] = useState([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState([]);
  const [externalSummary, setExternalSummary] = useState("");
  const [userData, setUserData] = useState(null);
  const [competitorData, setCompetitorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputStep, setInputStep] = useState("industryOrNaics");
  const [userOpinion, setUserOpinion] = useState("");
  const [showClientDataModal, setShowClientDataModal] = useState(false);
  
  // File upload states for client data modal
  const [uploadedFiles, setUploadedFiles] = useState({
    executive_summary: null,
    income_statement_by_department: null,
    income_statement_yoy: null,
    balance_sheet: null,
    cash_flow: null,
    finance_record: null,
    workforce: null,
    forecasted_executive_summary: null
  });
  const [uploadError, setUploadError] = useState({});
  const [folderUploadMode, setFolderUploadMode] = useState(false);
  const [uploadedFileNames, setUploadedFileNames] = useState([]);

  // Load saved data from Clerk (if signed in) on mount or when user changes
  useEffect(() => {
    const load = async () => {
      if (isSignedIn && user) {
        console.log("Loading user data from Clerk...");
        console.log("User publicMetadata:", user.publicMetadata);
        
        const meta = user.publicMetadata || {};
        if (meta.companyName) {
          console.log("Loading companyName:", meta.companyName);
          setCompanyName(String(meta.companyName));
        }
        if (meta.naicsCode) {
          console.log("Loading naicsCode:", meta.naicsCode);
          setNaicsCode(String(meta.naicsCode));
        }
        if (meta.selectedState) {
          console.log("Loading selectedState:", meta.selectedState);
          setSelectedState(String(meta.selectedState));
        }
        if (meta.keywords) {
          console.log("Loading keywords:", meta.keywords);
          setKeywords(String(meta.keywords));
        }
      }
    };
    load();
  }, [isSignedIn, user]);

  // Save helpers
  const saveToProfile = async (key, value) => {
    try {
      if (isSignedIn && user) {
        console.log(`Saving ${key}:`, value);
        const current = user.publicMetadata || {};
        const newMetadata = { ...current, [key]: value };
        console.log("New metadata:", newMetadata);
        
        await user.update({ publicMetadata: newMetadata });
        console.log("Successfully saved to Clerk");
      }
    } catch (e) {
      console.error("Failed to save to profile:", e);
    }
  };

  // File upload handlers for client data modal
  const handleFileUpload = (reportType, event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setUploadedFiles(prev => ({ ...prev, [reportType]: file }));
        setUploadError(prev => ({ ...prev, [reportType]: "" }));
      } else {
        setUploadError(prev => ({ ...prev, [reportType]: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)" }));
        setUploadedFiles(prev => ({ ...prev, [reportType]: null }));
      }
    }
  };

  // Updated folder upload handler - store file objects for backend processing
  const handleFolderUpload = (event) => {
    const files = Array.from(event.target.files);
    const newUploadErrors = { ...uploadError };
    const newUploadedFiles = { ...uploadedFiles };
    
    // Clear previous errors
    Object.keys(newUploadErrors).forEach(key => {
      newUploadErrors[key] = "";
    });
    
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        validFiles.push(file.name);
        // Store the file object with a generic key since we don't know the specific report type
        // The backend will identify the file type by content
        newUploadedFiles[`folder_file_${file.name}`] = file;
      } else {
        invalidFiles.push(file.name);
        newUploadErrors[file.name] = "Please upload a CSV or Excel file (.csv, .xlsx, .xls)";
      }
    });
    
    setUploadedFileNames(validFiles);
    setUploadedFiles(newUploadedFiles);
    setUploadError(newUploadErrors);
  };

  // Convert file to base64 for JSON POST
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Convert all uploaded files to base64
  const convertFilesToBase64 = async () => {
    const base64Files = {};
    for (const [reportType, file] of Object.entries(uploadedFiles)) {
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          base64Files[reportType] = {
            filename: file.name,
            content: base64,
            type: file.type
          };
        } catch (error) {
          console.error(`Error converting ${file.name}:`, error);
        }
      }
    }
    return base64Files;
  };

  const handleCompanyNameChange = (value) => {
    setCompanyName(value);
    saveToProfile('companyName', value);
  };

  const handleNaicsCodeChange = (value) => {
    setNaicsCode(value);
    saveToProfile('naicsCode', value);
  };

  const handleSelectedStateChange = (value) => {
    setSelectedState(value);
    saveToProfile('selectedState', value);
  };

  const handleKeywordsChange = (value) => {
    setKeywords(value);
    saveToProfile('keywords', value);
  };



  const promptFormatOptions = [
    {
      label: "Default (Sectioned Report)",
      displayValue: `**Company Performance Analysis**
  Industry Overview
  The company operates in the industry of women's clothing stores (NAICS code 448120). According to the U.S. Economic Census, the industry's CAGR from 2012 to 2017 was -0.028, and from 2017 to 2022, it was .56.
  
  **Company Performance**
  The company's sales data shows a declining trend, with a CAGR of -0.10 from 2017 to 2022. This is a concerning sign, as it indicates a decrease in sales over the past five years.
  
  **Expert Opinion**
  Greg Finance, our expert analyst, has predicted a 6% drop in sales due to tarrifs. 
  
  **Comparison to Industry Peers**
  We analyzed the 10-K reports of other companies in the industry, including Torrid Holdings Inc., Tapestry Inc., and Chico's FAS, Inc. These companies have reported revenue growth rates ranging from -0.00 to 0.03. In comparison, our company's sales decline is a significant concern.
  
  **Economic Indicators**
  At the state level, Florida's Real GDP has grown from 2023 to 2025, with a year-over-year growth rate of 0.028456581147295656 in 2025. The Unemployment Rate in Florida has also decreased from 2023 to 2025. Nationally, the Nominal GDP and Real GDP have both grown from 2023 to 2025, with year-over-year growth rates of 0.048573869948537185 and 0.02262176119973547, respectively. The Unemployment Rate has also decreased nationally from 2023 to 2025.
  
  **Budget vs Actuals Variance**
  The variance report shows significant differences between actual costs and budgeted costs, with variances ranging from -95.000 to 100.000000 in Development Costs, and -42.500 to 65.050 in Maintenance Cost.
  
  **Search Trends**
  The search trends for the company's name and keywords associated with the company indicate a decline in interest from 2020 to 2022, with a slight increase in 2023 and 2024. This could be a sign of declining brand awareness or relevance.
  
  **Conclusion**
  In conclusion, the company's performance is a concern, with declining sales and a significant gap between actual and budgeted costs. The industry peers have reported growth, and the economic indicators are positive, but the company's performance is not reflecting these trends. Immediate attention is required to address the expert's actions and to turnaround the company's sales and financial performance.`,
      backendValue: `**Company Performance Analysis**
  Industry Overview
  <Census CAGR rates, description of company and industry>
  
  **Company Performance**
  <Description of Company Performance>
  
  **Expert Opinion**
  <Description of Expert Opinion>
  
  **Comparison to Industry Peers**
  <Description of 10K reports and CAGRs>
  
  **Economic Indicators**
  <Description of Economic Indicators>
  
  **Budget vs Actuals Variance**
  <Description of Budget vs Actuals Variance>
  
  **Search Trends**
  <Description of Search Trends>
  
  **Conclusion**
  <Conclusion>`
    },
    {
      label: "Narrative style (Formal, personable letter)",
      displayValue: `Thank you for the opportunity to conduct an analysis of your company's recent performance. I've reviewed key financial and operational indicators in the context of industry trends and broader economic conditions, and I would like to share my findings and recommendations.
  
  Your company operates within the women's clothing retail sector, classified under NAICS code 448120. According to the U.S. Economic Census, the industry experienced a compound annual growth rate (CAGR) of -2.8% between 2012 and 2017. However, from 2017 to 2022, the sector showed modest recovery, with an estimated CAGR of 0.56%.
  
  In contrast, your company has experienced a decline in sales over the same recent period. Between 2017 and 2022, your reported CAGR was -10%, indicating a consistent downward trend in revenue that significantly diverges from broader industry movement. This pattern is cause for concern and warrants further strategic evaluation.
  
  Our senior analyst, Greg Finance, has projected an additional 6% drop in sales due to the impact of tariffs. While external pressures are not uncommon in this industry, the compounding effect of these projections with your current performance highlights the urgency of a proactive response.
  
  When comparing your company's performance with publicly available data from peer firms, such as Torrid Holdings Inc., Tapestry Inc., and Chico's FAS, Inc., we found that competitors have generally maintained more stable trajectories, with growth ranging from approximately 0% to 3%. The gap in performance suggests a need to reassess your market positioning and operational strategy.
  
  Meanwhile, macroeconomic indicators at both the state and national levels are relatively favorable. Florida's real GDP has shown steady growth from 2023 to 2025, reaching a 2.85% year-over-year increase in 2025, while unemployment has declined during the same period. National GDP trends mirror this positivity, with nominal growth at 4.86% and real growth at 2.26%, alongside falling unemployment. These conditions suggest that your performance challenges are not the result of an unfavorable external climate.
  
  A review of your budget vs. actual expenditures reveals considerable variances. Development costs ranged from being under budget by $95,000 to exceeding it by $100,000, while maintenance costs varied between -$42,500 and +$65,050. Such large fluctuations point to issues with cost estimation or operational execution, both of which deserve immediate attention.
  
  Finally, our analysis of search trends related to your brand and associated keywords shows a decline in consumer interest between 2020 and 2022. Though there is a mild uptick in 2023 and 2024, the overall pattern could signal a loss of brand visibility or relevance in the market.
  
  In summary, while economic and industry conditions are generally improving, your company's financial performance does not appear to be capitalizing on these trends. The combination of declining sales, substantial budget variances, and reduced consumer engagement suggests that focused corrective actions are necessary. I recommend addressing internal inefficiencies, reviewing your market strategy, and exploring immediate steps to stabilize revenue and improve cost control.
  
  Please let me know if you would like to schedule a meeting to discuss these findings in more detail or explore actionable next steps. I am at your disposal.
  
  Sincerely,
  Financial Analyst`,
      backendValue: `Thank you for the opportunity to conduct an analysis of your company's recent performance. I've reviewed key financial and operational indicators in the context of industry trends and broader economic conditions, and I would like to share my findings and recommendations.

  Your company operates within the <industry> sector, classified under NAICS code <naics_code>. According to the U.S. Economic Census, the industry experienced <industry_cagr_description>.

  In contrast, your company has experienced <company_performance_description>. This pattern is cause for concern and warrants further strategic evaluation.

  Our senior analyst, <expert_name>, has <expert_opinion_description>. While external pressures are not uncommon in this industry, the compounding effect of these projections with your current performance highlights the urgency of a proactive response.

  When comparing your company's performance with publicly available data from peer firms, we found that <peer_comparison_description>. The gap in performance suggests a need to reassess your market positioning and operational strategy.

  Meanwhile, macroeconomic indicators at both the state and national levels are <economic_indicators_description>. These conditions suggest that your performance challenges are not the result of an unfavorable external climate.

  A review of your budget vs. actual expenditures reveals <budget_variance_description>. Such large fluctuations point to issues with cost estimation or operational execution, both of which deserve immediate attention.

  Finally, our analysis of search trends related to your brand and associated keywords shows <search_trends_description>. Though there is a mild uptick in recent periods, the overall pattern could signal a loss of brand visibility or relevance in the market.

  In summary, while economic and industry conditions are generally improving, your company's financial performance does not appear to be capitalizing on these trends. The combination of declining sales, substantial budget variances, and reduced consumer engagement suggests that focused corrective actions are necessary. I recommend addressing internal inefficiencies, reviewing your market strategy, and exploring immediate steps to stabilize revenue and improve cost control.

  Please let me know if you would like to schedule a meeting to discuss these findings in more detail or explore actionable next steps. I am at your disposal.

  Sincerely,
  Financial Analyst`
    }
  ];



  const stateAbbrs = [
    "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL",
    "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
    "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
    "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
    "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];
  
  const handleNaicsSubmit = async () => {
    if (!naicsCode) return;

    const params = new URLSearchParams({ naics_code: naicsCode });
    if (selectedState) params.append("state", selectedState);
    if (keywords) params.append("key_words", keywords);

    const response = await fetch(`https://external-data-backend.onrender.com/add_company_data/?${params.toString()}`);
    const data = await response.json();
    setSuggestedCompanies(data);
    setInputStep("selectCiks");
  };
  
  const handleGetTrends = async () => {
    setLoading(true);
    setExternalSummary("");
    setUserData(null);
    setCompetitorData([]);

    try {
          const naicsCodeValue = naicsCode;

      // Prepare the basic request body
      const body = {
        naics_code: parseInt(naicsCodeValue),
        ...(cikInputs.length > 0 && { company_ciks: cikInputs }),
        ...(userOpinion.trim() && { expert_opinion: userOpinion.trim() }),
        ...(expertName.trim() && { expert_name: expertName.trim() }),
        fred_data_keys: selectedIndicators, 
        fred_data_state: selectedState,
        company_name: companyName,
        company_keywords: keywords
          .split(",")
          .map(k => k.trim())
          .filter(k => k.length > 0),
        format_example: (() => {
          // If a template is selected, use the backend version
          if (selectedPromptFormat !== "custom") {
            const selected = promptFormatOptions.find(opt => opt.label === selectedPromptFormat);
            return selected ? selected.backendValue : editablePrompt;
          }
          // If custom, use the user's input
          return editablePrompt;
        })()
      };

      // Check if there are uploaded files to send
      const uploadedFilesList = Object.values(uploadedFiles).filter(file => file !== null);
      
      if (uploadedFilesList.length > 0) {
        // Convert files to base64 and include in JSON
        const base64Files = await convertFilesToBase64();
        body.files = base64Files;
        
        console.log("Sending files as base64 in JSON:", Object.keys(base64Files));
      }

      // Always send as JSON POST
      const response = await fetch(
        "https://external-data-backend.onrender.com/get_trends/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setExternalSummary(data.summary);
      setUserData(data.user_data);
      setCompetitorData(data.industry_tables);
      setFredData(data.fred_data);
      setTrendData(data.trends);
    } catch (error) {
      console.error("API error:", error);
      setExternalSummary("Error retrieving summary from backend.");
    } finally {
      setLoading(false);
    }
  };
  
  const formatHeader = (header) => {
    return header
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
      .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words
  };

  const formatColumnHeader = (header) => {
    const headerMap = {
      'year': 'Year',
      'val': 'Value',
      'date': 'Date',
      'value': 'Value',
      'amount': 'Amount',
      'percent': 'Percentage',
      'revenue': 'Revenue',
      'income': 'Income',
      'expenses': 'Expenses',
      'profit': 'Profit',
      'loss': 'Loss',
      'net_income': 'Net Income',
      'gross_margin': 'Gross Margin',
      'cash_balance': 'Cash Balance',
      'total_assets': 'Total Assets',
      'total_liabilities': 'Total Liabilities',
      'operating_expenses': 'Operating Expenses',
      'cogs': 'Cost of Goods Sold'
    };
    
    return headerMap[header.toLowerCase()] || formatHeader(header);
  };

  const formatNumber = (value, columnName = null) => {
    if (typeof value === 'number') {
      // Check if this is a year column - years are typically 4-digit numbers
      const isYearColumn = columnName && (
        columnName.toLowerCase() === 'year' || 
        columnName.toLowerCase().includes('year') ||
        (value >= 1900 && value <= 2100 && Number.isInteger(value))
      );
      
      if (isYearColumn) {
        // For year columns, don't add commas
        return value.toString();
      } else {
        // For other numeric values, use locale formatting with commas
        return value.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      }
    }
    return value;
  };

  const filterNaRows = (data) => {
    if (!Array.isArray(data)) return data;
    
    // Find the first non-N/A row
    const firstNonNaIndex = data.findIndex(entry => {
      const value = entry.value ?? entry[Object.keys(entry).find(key => key !== 'date')];
      return value !== "N/A" && value !== null && value !== undefined;
    });
    
    // If all rows are N/A, return empty array
    if (firstNonNaIndex === -1) return [];
    
    // Return from the first non-N/A row onwards
    return data.slice(firstNonNaIndex);
  };

  const renderTimeSeriesTables = (data, sectionTitle) => {
    if (!data) return null;
  
    const renderSection = (obj, depth = 0) => {
      return Object.entries(obj).map(([key, value], idx) => {
        if (Array.isArray(value)) {
          const filteredData = filterNaRows(value);
          if (filteredData.length === 0) return null;
          
          return (
            <div key={key + idx} style={{ marginBottom: "2em", marginLeft: depth * 20 }}>
              <h3>{formatHeader(key)}</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{formatColumnHeader(key)}</th>
                  </tr>
                </thead>
                <tbody>
                {filteredData.map((entry, i) => (
                  <tr key={i}>
                    <td>{new Date(entry.date).toISOString().split("T")[0]}</td>
                    <td>{formatNumber(entry[key] ?? entry.value ?? "N/A", key)}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          );
        } else if (typeof value === "object" && value !== null) {
          return (
            <div key={key + idx} style={{ marginLeft: depth * 20 }}>
              <h2>{formatHeader(key)}</h2>
              {renderSection(value, depth + 1)}
            </div>
          );
        } else {
          return null;
        }
      });
    };
  
    return (
      <div className="form-group">
        <h2>{sectionTitle}</h2>
        {renderSection(data)}
      </div>
    );
  };

  const renderTable = (data, title) => {
    if (!data || data.length === 0) return null;
    const columns = Object.keys(data[0]);

    // Filter out rows where all values are N/A
    const filteredData = data.filter(row => {
      return Object.values(row).some(value => 
        value !== "N/A" && value !== null && value !== undefined
      );
    });

    if (filteredData.length === 0) return null;

    return (
      <div style={{ overflowX: "auto", marginBottom: "2em" }}>
        <h3>{formatHeader(title)}</h3>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{formatColumnHeader(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{formatNumber(row[col], col)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEditFormat = () => (
    <div className="App" style={{ maxWidth: 800, margin: "0 auto", padding: "2em" }}>
      <h2>Edit Report Format</h2>
      <div className="form-group">
        <label>Select a format:</label>
        <select
          className="select-input"
          value={selectedPromptFormat}
          onChange={(e) => {
            const selected = promptFormatOptions.find(opt => opt.label === e.target.value);
            setSelectedPromptFormat(e.target.value);
            if (e.target.value === "custom") {
              // Don't change editablePrompt for custom option
            } else if (selected) {
              setEditablePrompt(selected.displayValue); // Show full template to user
            }
          }}
        >
          {promptFormatOptions.map((opt, idx) => (
            <option key={idx} value={opt.label}>{opt.label}</option>
          ))}
          <option value="custom">Custom (Paste your own)</option>
        </select>
      </div>
      
      {selectedPromptFormat !== "custom" && selectedPromptFormat && (
        <div className="form-group">
          <label>Preview of selected format:</label>
          <div 
            className="prompt-textarea"
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '12px',
              minHeight: '300px',
              backgroundColor: '#f9f9f9',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              textAlign: 'left'
            }}
            dangerouslySetInnerHTML={{
              __html: editablePrompt
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n\n/g, '</p><p style="margin: 1em 0;">')
                .replace(/^/, '<p style="margin: 1em 0;">')
                .replace(/$/, '</p>')
            }}
          />
        </div>
      )}
      
      {selectedPromptFormat === "custom" && (
        <div className="form-group">
          <label>Paste an example of a past report you would like to match the formatting of:</label>
          <textarea
            className="prompt-textarea"
            rows={16}
            placeholder="Paste an example report here to match its formatting..."
            value=""
            onChange={(e) => setEditablePrompt(e.target.value)}
          />
        </div>
      )}
      
      <button className="primary-btn" onClick={() => setView("main")}>Back to Main</button>
    </div>
  );

  const renderClientDataModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2em',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2>Edit Client Data</h2>
        
        {/* Basic Company Information */}
        <div style={{ marginBottom: '2em', padding: '1em', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Company Name:</label>
            <input
              type="text"
              className="text-input"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label>NAICS Code:</label>
            <input
              type="text"
              className="text-input"
              value={naicsCode}
              onChange={(e) => handleNaicsCodeChange(e.target.value)}
              placeholder="e.g. 541611"
            />
          </div>

          <div className="form-group">
            <label>State:</label>
            <select
              className="select-input"
              value={selectedState}
              onChange={(e) => handleSelectedStateChange(e.target.value)}
            >
              {stateAbbrs.map((abbr) => (
                <option key={abbr} value={abbr}>
                  {abbr || "Select State"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Keywords:</label>
            <input
              type="text"
              className="text-input"
              value={keywords}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="e.g. dog grooming, cloud computing"
            />
          </div>


        </div>

        {/* Financial Reports Upload */}
        <div style={{ marginBottom: '2em' }}>
          <h3>Upload Financial Reports</h3>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '1em' }}>
            Upload your financial reports to get automatic analysis and insights
          </p>

          {/* Quick Upload Option - RECOMMENDED */}
          <div style={{ 
            marginBottom: '2em', 
            padding: '1.5em', 
            border: '2px solid #FBC02D', 
            borderRadius: '8px', 
            backgroundColor: '#fffbf0' 
          }}>
            <h4 style={{ color: '#B8860B', marginBottom: '0.5em' }}>Quick Upload (Recommended)</h4>
            <p style={{ fontSize: '0.9em', color: '#B8860B', marginBottom: '0.5em', fontWeight: 'bold' }}>
              Upload all your files at once - they'll be automatically identified by content
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFolderUpload}
              style={{ marginBottom: '0.5em' }}
            />
            <p style={{ fontSize: '0.8em', color: '#B8860B', marginTop: '0.5em' }}>
              Fastest way to upload multiple reports
            </p>
            
            {/* Show uploaded file names */}
            {uploadedFileNames.length > 0 && (
              <div style={{ marginTop: '1em', padding: '1em', backgroundColor: '#f0f8f0', borderRadius: '5px', border: '1px solid #4CAF50' }}>
                <h5 style={{ color: '#2E7D32', marginBottom: '0.5em' }}>Uploaded Files:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.5em', color: '#2E7D32' }}>
                  {uploadedFileNames.map((fileName, index) => (
                    <li key={index} style={{ fontSize: '0.9em', marginBottom: '0.25em' }}>
                      {fileName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Show any errors */}
            {Object.keys(uploadError).length > 0 && (
              <div style={{ marginTop: '1em', padding: '1em', backgroundColor: '#fff5f5', borderRadius: '5px', border: '1px solid #f44336' }}>
                <h5 style={{ color: '#d32f2f', marginBottom: '0.5em' }}>Invalid Files:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.5em', color: '#d32f2f' }}>
                  {Object.entries(uploadError).map(([fileName, error]) => (
                    <li key={fileName} style={{ fontSize: '0.9em', marginBottom: '0.25em' }}>
                      {fileName}: {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Individual File Uploads */}
          <div style={{ 
            marginTop: '1em', 
            padding: '1em', 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            backgroundColor: '#f9f9f9' 
          }}>
            <h4 style={{ color: '#666', marginBottom: '0.5em' }}>Or upload files individually:</h4>

            {/* Executive Summary */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Executive Summary</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Monthly revenue, cash balance, and net income data
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('executive_summary', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.executive_summary && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.executive_summary.name}
                </div>
              )}
              {uploadError.executive_summary && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.executive_summary}
                </div>
              )}
            </div>

            {/* Income Statement by Department */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Income Statement by Department</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Revenue, COGS, operating expenses by department
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('income_statement_by_department', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.income_statement_by_department && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.income_statement_by_department.name}
                </div>
              )}
              {uploadError.income_statement_by_department && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.income_statement_by_department}
                </div>
              )}
            </div>

            {/* Income Statement YoY */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Income Statement Year-over-Year</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Current vs prior year revenue, net income, and gross margin
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('income_statement_yoy', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.income_statement_yoy && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.income_statement_yoy.name}
                </div>
              )}
              {uploadError.income_statement_yoy && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.income_statement_yoy}
                </div>
              )}
            </div>

            {/* Balance Sheet */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Balance Sheet</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Assets, liabilities, and equity breakdown
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('balance_sheet', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.balance_sheet && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.balance_sheet.name}
                </div>
              )}
              {uploadError.balance_sheet && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.balance_sheet}
                </div>
              )}
            </div>

            {/* Cash Flow */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Cash Flow Statement</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Operating, investing, and financing cash flows
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('cash_flow', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.cash_flow && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.cash_flow.name}
                </div>
              )}
              {uploadError.cash_flow && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.cash_flow}
                </div>
              )}
            </div>

            {/* Finance Record (Budget vs Actuals) */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Finance Record (Budget vs Actuals)</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Budget vs actual cost variances and anomalies
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('finance_record', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.finance_record && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.finance_record.name}
                </div>
              )}
              {uploadError.finance_record && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.finance_record}
                </div>
              )}
            </div>

            {/* Workforce */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Workforce</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Employee count, turnover, and personnel costs
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('workforce', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.workforce && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.workforce.name}
                </div>
              )}
              {uploadError.workforce && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.workforce}
                </div>
              )}
            </div>

            {/* Forecasted Executive Summary */}
            <div style={{ marginBottom: '1em', padding: '1em', border: '1px solid #eee', borderRadius: '5px' }}>
              <h4>Forecasted Executive Summary</h4>
              <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '0.5em' }}>
                Projected revenue, cash balance, and net income data for future periods
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload('forecasted_executive_summary', e)}
                style={{ marginBottom: '0.5em' }}
              />
              {uploadedFiles.forecasted_executive_summary && (
                <div style={{ fontSize: '0.9em', color: '#4CAF50', marginBottom: '0.5em' }}>
                  ✅ {uploadedFiles.forecasted_executive_summary.name}
                </div>
              )}
              {uploadError.forecasted_executive_summary && (
                <div style={{ fontSize: '0.9em', color: '#f44336', marginBottom: '0.5em' }}>
                  ❌ {uploadError.forecasted_executive_summary}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1em', marginTop: '1em' }}>
          <button 
            className="primary-btn" 
            onClick={() => setShowClientDataModal(false)}
          >
            Save & Close
          </button>
          <button 
            className="secondary-btn" 
            onClick={() => setShowClientDataModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Minimal auth header
  const renderAuthHeader = () => (
    <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1em' }}>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );

  if (view === "editPrompt") return renderEditFormat();

  if (view === "editPrompt") {
    const renderTailorPrompt = () => {
      const uneditable = `You will receive:
    - The company's raw performance data
    - A summarized view of that data
    - A finacial analysist's own opinion of the company's performance (this should be treated as an expert opinion and not be disputed)
    - The company's CAGR (calculated using average values from two periods, adjusted for inflation)
    - The industry's CAGR from the U.S. Economic Census (snapshot between 2 single years, also inflation-adjusted)
    - Relevant economic indicators at both the state and national level
    - Relevant tables from 10-K reports of other companies in this industry, to help identify market trends 
    - A variance report showing how actual costs differ from budgeted costs`;
    
      return (
        <div className="App" style={{ maxWidth: 800, margin: "auto", padding: "2em" }}>
          <h2>Edit Prompt</h2>
    
          <div className="prompt-box">
            <label>Prompt (editable):</label>
            <textarea
              className="prompt-textarea"
              rows={16}
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
            />
          </div>
    
          <div className="uneditable-text">
            <label>Not editable:</label>
            <pre>{uneditable}</pre>
          </div>
          <button className="primary-btn" onClick={() => setView("main")}>
            Back to Main
          </button>
        </div>
      );
    };
    return renderTailorPrompt();
  }
  
  return (
    <div className="App">
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px"
        }}
      >
        <SignedOut>
          <SignInButton>
            <button
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                backgroundColor: "#FBC02D",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      <button
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "8px 12px",
          fontSize: "14px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "1px solid #ccc",
          borderRadius: "5px",
          cursor: "pointer"
        }}
        onClick={() => setShowClientDataModal(true)}
      >
        Edit Client Data
      </button>

      {inputStep === "industryOrNaics" && (
        <>
          <div style={{ 
            marginTop: '3em',
            padding: '2em',
            textAlign: 'center'
          }}>
            <div style={{ 
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h2>Welcome to Smart Summary</h2>
              <p style={{ fontSize: '1.1em', color: '#666', marginBottom: '2em' }}>
                Configure your company data using the "Edit Client Data" button above, then click below to generate your report.
              </p>
            </div>
            
            <div className="form-group">
              <button
                className="primary-btn"
                style={{
                  fontSize: '1.2em',
                  padding: '15px 30px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}
                            onClick={() => handleNaicsSubmit()}
            disabled={!naicsCode}
              >
                Get Report Summary 
              </button>
            </div>
          </div>
        </>
      )}
      
      {inputStep === "selectCiks" && (
        <>
          {suggestedCompanies.length > 0 && (
            <div className="form-group">
              <h3>Suggested Companies:</h3>
              {suggestedCompanies.map((item, i) => {
                // Use both name and CIK for more precise matching
                const isSelected = cikInputs.some((c) => c.cik === item.cik && c.name === item.name);
                return (
                  <button
                    key={`${item.cik}-${item.name}-${i}`}
                    className={`secondary-btn company-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      console.log('Clicked company:', item.name, 'CIK:', item.cik);
                      console.log('Current cikInputs:', cikInputs);
                      
                      setCikInputs((prev) => {
                        const isCurrentlySelected = prev.some((c) => c.cik === item.cik && c.name === item.name);
                        console.log('Is currently selected:', isCurrentlySelected);
                        
                        if (isCurrentlySelected) {
                          // Remove this specific company
                          const filtered = prev.filter((c) => !(c.cik === item.cik && c.name === item.name));
                          console.log('Removed company, new list:', filtered);
                          return filtered;
                        } else {
                          // Add this specific company
                          const newList = [...prev, { name: item.name, cik: item.cik }];
                          console.log('Added company, new list:', newList);
                          return newList;
                        }
                      });
                    }}
                  >
                    {item.name} (CIK: {item.cik}{item.state ? `, State: ${item.state}` : ""})
                  </button>
                );
              })}
            </div>
          )}

          <div className="form-group">
            <label>Add your own CIK numbers for competitors (comma separated):</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. 0000320193, 0000789019"
              onChange={(e) => {
                const values = e.target.value.split(/,\s*/).filter(Boolean);
                const objects = values.map((cik) => ({ name: null, cik }));
                setCikInputs(objects);
              }}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="user-opinion">Optional: Share your own insights or concerns about your business</label>
            <textarea
              id="user-opinion"
              className="text-area"
              value={userOpinion}
              onChange={(e) => setUserOpinion(e.target.value)}
              placeholder="e.g. I'm concerned about seasonal fluctuations, or I think demand will increase due to a new local law."
            />
          </div>

          <div className="form-group">
            <label htmlFor="expert-name">Optional: Expert Name</label>
            <input
              id="expert-name"
              type="text"
              className="text-input"
              placeholder="e.g. John Smith, Your Company"
              value={expertName}
              onChange={(e) => setExpertName(e.target.value)}
            />
            <EconomicIndicatorsBox
              selectedIndicators={selectedIndicators}
              setSelectedIndicators={setSelectedIndicators}
            />
          </div>

          <div className="form-group">
            <button className="secondary-btn" onClick={() => setCikInputs([])}>
              Skip (no CIKs)
            </button>
          </div>

          <div className="form-group" style={{ textAlign: 'center' }}>
            <button
              className="primary-btn"
              onClick={handleGetTrends}
              disabled={loading}
              style={{
                minWidth: '200px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? "Analyzing..." : "Get Report Summary"}
            </button>
          </div>
        </>
      )}
      
      {externalSummary && (
        <div className="external-summary">
          <h2>External Summary:</h2>
          <div 
            style={{
              backgroundColor: '#f9f9f9',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              lineHeight: '1.6',
              fontSize: '16px'
            }}
          >
            <ReactMarkdown>{externalSummary}</ReactMarkdown>
          </div>
        </div>
      )}

      {userData && (
        <div className="form-group">
          <h2>User Data:</h2>
          {renderTable(userData, "Your Company Data")}
        </div>
      )}

      {competitorData.length > 0 && (
        <div className="form-group">
          <h2>Competitor Data:</h2>
          {competitorData.map((entry, i) => (
            <div key={i}>
              <h3>{entry.name} (CIK: {entry.cik})</h3>
              {entry.data &&
                Object.entries(entry.data).map(([key, df], j) => (
                  <div key={j}>
                    {renderTable(df, key)}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {fredData && renderTimeSeriesTables(fredData, "Economic Indicators (FRED)")}
      {trendData && renderTimeSeriesTables(trendData, "Google Search Trends")}

      {showClientDataModal && renderClientDataModal()}

      <img src={process.env.PUBLIC_URL + "/jirav.svg"} alt="Jirav logo" className="footer-logo" />
    </div>
  );
}
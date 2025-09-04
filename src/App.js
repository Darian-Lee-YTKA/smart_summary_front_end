import React, { useState, useEffect } from "react";
import "./style.css";
import EconomicIndicatorsBox from "./EconomicIndicatorsBox";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

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

  // Add this new state variable near the top with other state variables (around line 54)
  const [manualCikInput, setManualCikInput] = useState("");

  // Load saved data from Clerk (if signed in) on mount or when user changes
  useEffect(() => {
    const load = async () => {
      if (isSignedIn && user) {
        console.log("Loading user data from Clerk...");
        console.log("User unsafeMetadata:", user.unsafeMetadata);
        
        const meta = user.unsafeMetadata || {};
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
        if (meta.cikInputs) {
          console.log("Loading cikInputs:", meta.cikInputs);
          setCikInputs(JSON.parse(meta.cikInputs));
          // Set the manual CIK input to show manually entered CIKs
          const loadedCiks = JSON.parse(meta.cikInputs);
          const manualCiks = loadedCiks.filter(c => c.name === null).map(c => c.cik).join(', ');
          setManualCikInput(manualCiks);
        }
        if (meta.userOpinion) {
          console.log("Loading userOpinion:", meta.userOpinion);
          setUserOpinion(String(meta.userOpinion));
        }
        if (meta.expertName) {
          console.log("Loading expertName:", meta.expertName);
          setExpertName(String(meta.expertName));
        }
        if (meta.selectedIndicators) {
          console.log("Loading selectedIndicators:", meta.selectedIndicators);
          setSelectedIndicators(JSON.parse(meta.selectedIndicators));
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
        const current = user.unsafeMetadata || {};
        const newMetadata = { ...current, [key]: value };
        console.log("New metadata:", newMetadata);
        
        await user.update({ unsafeMetadata: newMetadata });
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
  };

  const handleNaicsCodeChange = (value) => {
    setNaicsCode(value);
  };

  const handleSelectedStateChange = (value) => {
    setSelectedState(value);
  };

  const handleKeywordsChange = (value) => {
    setKeywords(value);
  };

  const handleCikInputsChange = (value) => {
    setCikInputs(value);
  };

  const handleUserOpinionChange = (value) => {
    setUserOpinion(value);
  };

  const handleExpertNameChange = (value) => {
    setExpertName(value);
  };

  const handleSelectedIndicatorsChange = (value) => {
    setSelectedIndicators(value);
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
    // Check if client data is completely empty
    const isClientDataEmpty = !companyName && !naicsCode && !selectedState && !keywords;
    
    // Check if financial data is missing
    const uploadedFilesList = Object.values(uploadedFiles).filter(file => file !== null);
    const isFinancialDataMissing = uploadedFilesList.length === 0;

    if (isClientDataEmpty) {
      alert('Please update your client information in the "Edit Client Data" section before generating a report summary.');
      return;
    }

    if (isFinancialDataMissing) {
      alert('Please upload at least one financial report before generating a report summary.');
      return;
    }

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
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
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
            <h4 style={{ color: '#B8860B', marginBottom: '0.5em' }}>Upload Financial Reports</h4>
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
              Supported file types: CSV, Excel (.xlsx, .xls)
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
        </div>

        {/* CIK Suggestions Section */}
        <div style={{ marginBottom: '2em', padding: '1em', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Competitor CIK Numbers</h3>
          
          {/* Saved CIKs Section */}
          {cikInputs.length > 0 && (
            <div style={{ marginBottom: '2em', padding: '1em', border: '1px solid #4CAF50', borderRadius: '8px', backgroundColor: '#f0f8f0' }}>
              <h4 style={{ color: '#2E7D32', marginBottom: '0.5em' }}>Saved CIKs</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', marginBottom: '1em' }}>
                {cikInputs.map((item, i) => (
                  <div
                    key={`saved-${item.cik}-${i}`}
                    style={{
                      padding: '0.5em 1em',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.9em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5em'
                    }}
                  >
                    <span>
                      {item.name ? `${item.name} (CIK: ${item.cik})` : `CIK: ${item.cik}`}
                    </span>
                    <button
                      onClick={() => {
                        setCikInputs(prev => prev.filter((_, index) => index !== i));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.2em',
                        padding: '0',
                        marginLeft: '0.5em'
                      }}
                      title="Remove this CIK"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label>Get CIK Suggestions:</label>
            <button
              className="secondary-btn"
              onClick={async () => {
                if (!naicsCode) {
                  alert("Please enter a NAICS code first");
                  return;
                }
                
                const params = new URLSearchParams({ naics_code: naicsCode });
                if (selectedState) params.append("state", selectedState);
                if (keywords) params.append("key_words", keywords);

                try {
                  const response = await fetch(`https://external-data-backend.onrender.com/add_company_data/?${params.toString()}`);
                  const data = await response.json();
                  setSuggestedCompanies(data);
                } catch (error) {
                  console.error("Error fetching CIK suggestions:", error);
                }
              }}
              disabled={!naicsCode}
            >
              Get Competitor Suggestions
            </button>
          </div>

          {suggestedCompanies.length > 0 && (
            <div className="form-group">
              <label>Suggested Companies:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', marginBottom: '1em' }}>
                {suggestedCompanies.map((item, i) => {
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
            </div>
          )}

          <div className="form-group">
            <label>Add your own CIK numbers (comma separated):</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. 0000320193, 0000789019"
              value={manualCikInput}
              onChange={(e) => {
                setManualCikInput(e.target.value);
                // Process the input and update cikInputs
                const values = e.target.value.split(/,\s*/).filter(Boolean);
                const objects = values.map((cik) => ({ name: null, cik }));
                // Keep existing selected companies and add/update manual CIK inputs
                const existingCompanies = cikInputs.filter(c => c.name !== null);
                const newCikInputs = [...existingCompanies, ...objects];
                handleCikInputsChange(newCikInputs);
              }}
            />
          </div>

          <div className="form-group">
            <label>Expert Opinion:</label>
            <textarea
              className="text-area"
              value={userOpinion}
              onChange={(e) => handleUserOpinionChange(e.target.value)}
              placeholder="e.g. I'm concerned about seasonal fluctuations, or I think demand will increase due to a new local law."
            />
          </div>

          <div className="form-group">
            <label>Expert Name:</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. John Smith, Your Company"
              value={expertName}
              onChange={(e) => handleExpertNameChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Economic Indicators:</label>
            <EconomicIndicatorsBox
              selectedIndicators={selectedIndicators}
              setSelectedIndicators={handleSelectedIndicatorsChange}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2em' }}>
          <button 
            className="primary-btn" 
            onClick={async () => {
              // Save all data when closing modal
              if (isSignedIn && user) {
                const current = user.unsafeMetadata || {};
                const newMetadata = { 
                  ...current, 
                  companyName,
                  naicsCode,
                  selectedState,
                  keywords,
                  cikInputs: JSON.stringify(cikInputs),
                  manualCikInput,
                  userOpinion,
                  expertName,
                  selectedIndicators: JSON.stringify(selectedIndicators)
                };
                await user.update({ unsafeMetadata: newMetadata });
              }
              setShowClientDataModal(false);
            }}
          >
            Save & Close
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
                            onClick={() => handleGetTrends()}
            disabled={!naicsCode}
              >
                Get Report Summary 
              </button>
            </div>
          </div>
        </>
      )}
      
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2em',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '2em'
        }}>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            Generating your industry analysis summary...
          </p>
        </div>
      )}

      {externalSummary && (
        <div className="external-summary">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <h2 style={{ margin: 0, flex: 1, minWidth: '200px' }}>External Summary:</h2>
            <button
              onClick={async () => {
                try {
                  // Convert markdown to plain text for email with proper formatting
                  const plainTextSummary = externalSummary
                    .replace(/^#+\s*(.*)$/gm, '$1:') // Add colons after headers
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
                    .replace(/`(.*?)`/g, '$1') // Remove code markdown
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
                    .replace(/^[-*+]\s+(.*)$/gm, '\t- $1') // Convert bullet points with proper tab spacing
                    .replace(/^\d+\.\s+(.*)$/gm, '\t$1') // Convert numbered lists with tab spacing
                    .replace(/\n\n/g, '\n\n') // Keep paragraph breaks
                    .replace(/\n/g, '\n') // Keep line breaks
                    .trim();

                  // Format the summary for plain text email
                  const plainTextEmail = `Dear Team,

Please find below the comprehensive industry analysis report:

${plainTextSummary}

Best regards,
${expertName || 'Your Name'}`;

                  await navigator.clipboard.writeText(plainTextEmail);
                  alert('Email template copied to clipboard! Ready to paste into your email.');
                } catch (err) {
                  console.error('Failed to copy: ', err);
                  alert('Failed to copy to clipboard. Please try again.');
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'hsl(17, 78%, 49%)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                height: 'fit-content'
              }}
            >
              Copy Email Template
            </button>
          </div>
          <div 
            id="summary-content"
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

// Export functions
const exportToPDF = async () => {
  const element = document.getElementById('summary-content');
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save('summary-report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
};

const exportToDOCX = async () => {
  try {
    // Convert markdown to plain text for DOCX
    const plainText = externalSummary
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n\n/g, '\n') // Clean up line breaks
      .trim();
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Company Performance Analysis Report",
                bold: true,
                size: 32
              })
            ],
            heading: HeadingLevel.TITLE
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: plainText,
                size: 24
              })
            ]
          })
        ]
      }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'summary-report.docx';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    alert('Error generating DOCX. Please try again.');
  }
};

const copyFormattedText = async () => {
  try {
    // Convert markdown to HTML for better formatting when pasted
    const htmlContent = externalSummary
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    const fullHtml = `<p>${htmlContent}</p>`;
    
    // Create a temporary element to copy HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = fullHtml;
    document.body.appendChild(tempElement);
    
    // Select and copy
    const range = document.createRange();
    range.selectNodeContents(tempElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    document.execCommand('copy');
    selection.removeAllRanges();
    document.body.removeChild(tempElement);
    
    alert('Formatted text copied to clipboard!');
  } catch (error) {
    console.error('Error copying text:', error);
    // Fallback to plain text
    try {
      await navigator.clipboard.writeText(externalSummary);
      alert('Text copied to clipboard!');
    } catch (fallbackError) {
      alert('Error copying text. Please try again.');
    }
  }
};
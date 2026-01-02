// src/pages/CreateModule.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";

import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TableViewIcon from "@mui/icons-material/TableView";
import PeopleIcon from "@mui/icons-material/People";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BusinessIcon from "@mui/icons-material/Business";

import DataGrid, { Column } from "devextreme-react/data-grid";
import "devextreme/dist/css/dx.common.css";
import "devextreme/dist/css/dx.light.css";

import * as XLSX from "xlsx";
import { api } from "api";

export default function CreateModule() {
  const navigate = useNavigate();

  const [moduleName, setModuleName] = useState("");
  const [mode, setMode] = useState("excel");
  const [selectedIcon, setSelectedIcon] = useState("table_view");

  const [file, setFile] = useState(null);
  const [excelParsed, setExcelParsed] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [excelColumns, setExcelColumns] = useState([]);
  const inputRef = useRef();

  const [columns, setColumns] = useState([]);
  const addColumn = () => setColumns([...columns, { id: uuidv4(), name: "", type: "string" }]);
  const removeColumn = (id) => setColumns(columns.filter((c) => c.id !== id));
  const updateColumn = (id, field, value) =>
    setColumns(columns.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const iconOptions = [
    { value: "table_view", label: "Table View", icon: <TableViewIcon /> },
    { value: "people", label: "People", icon: <PeopleIcon /> },
    { value: "inventory_2", label: "Inventory", icon: <Inventory2Icon /> },
    { value: "receipt", label: "Receipt", icon: <ReceiptIcon /> },
    { value: "business", label: "Business", icon: <BusinessIcon /> },
  ];

  const parseExcelFile = (fileObj) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse to JSON (headers are automatically handled)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          console.warn("Excel file is empty");
          return;
        }

        console.log("Parsed Excel Data:", jsonData);
        setExcelData(jsonData);

        // Extract headers from the first row keys
        setExcelColumns(Object.keys(jsonData[0]));
        setExcelParsed(true);
      } catch (error) {
        console.error("Error parsing excel:", error);
        alert("Failed to parse Excel file. Please ensure it is a valid format.");
      }
    };
    reader.readAsArrayBuffer(fileObj);
  };

  const onFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    parseExcelFile(f);
  };

  const onDropFile = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      parseExcelFile(f);
    }
  };

  const handleSubmit = async () => {
    if (!moduleName) return;

    // Derive columns based on mode
    let moduleColumns = [];
    if (mode === "excel") {
      if (!excelParsed) return;
      moduleColumns = excelColumns.map((field) => {
        const sample = excelData[0]?.[field];
        let type = "string";
        if (typeof sample === "number") type = "number";
        else if (sample instanceof Date) type = "date";
        else if (typeof sample === "boolean") type = "boolean";
        return { name: field, type, isEditable: true };
      });
    } else {
      moduleColumns = columns.map((c) => ({
        name: c.name,
        type: c.type,
        isEditable: true,
      }));
    }

    const modulePayload = {
      name: moduleName,
      key: moduleName.toLowerCase().replace(/\s+/g, "-"),
      icon: selectedIcon,
      route: `/${moduleName.toLowerCase().replace(/\s+/g, "-")}`,
      type: mode === "excel" ? "EXCEL" : "CREATION",
      columns: moduleColumns,
    };

    try {
      const moduleRes = await api.post("/modules", modulePayload);
      const moduleId = moduleRes.data.id;

      if (mode === "excel") {
        // Use backend upload endpoint
        const formData = new FormData();
        formData.append("file", file);

        await api.post(`/modules/${moduleId}/objects/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MDBox py={3} px={3}>
      <MDTypography variant="h4" gutterBottom>
        Create Module
      </MDTypography>

      <Box mb={3}>
        <TextField
          fullWidth
          label="Module Name"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
        />
      </Box>

      {/* Select Icon */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
        <FormControl fullWidth>
          <FormLabel>Select Icon</FormLabel>
          <Select
            value={selectedIcon}
            onChange={(e) => setSelectedIcon(e.target.value)}
            renderValue={(val) => {
              const o = iconOptions.find((i) => i.value === val);
              return (
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  {o.icon}
                  <Typography sx={{ ml: 1 }}>{o.label}</Typography>
                </Box>
              );
            }}
            sx={{
              mt: 1,
              "& .MuiSelect-select": {
                height: 56,
                display: "flex",
                alignItems: "center",
              },
            }}
          >
            {iconOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {o.icon}
                  <Typography sx={{ ml: 1 }}>{o.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Creation Mode */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
        <FormControl fullWidth>
          <FormLabel>Creation Mode</FormLabel>
          <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value)} sx={{ mt: 1 }}>
            <FormControlLabel value="excel" control={<Radio />} label="Create from Excel" />
            <FormControlLabel value="manual" control={<Radio />} label="Create by Yourself" />
          </RadioGroup>
        </FormControl>
      </Paper>

      {/* Excel Upload / Manual Columns */}
      {mode === "excel" && (
        <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
          <Box
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropFile}
            sx={{
              border: "2px dashed grey",
              borderRadius: 2,
              height: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {file ? (
              <MDTypography>{file.name}</MDTypography>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 48, mb: 1, color: "grey" }} />
                <MDTypography>Click or drag file here</MDTypography>
              </>
            )}
            <input type="file" accept=".xlsx,.xls" hidden ref={inputRef} onChange={onFileSelect} />
          </Box>

          {excelParsed && (
            <MDBox mt={4}>
              <MDTypography variant="h6">Preview Data</MDTypography>
              <DataGrid
                dataSource={excelData}
                keyExpr={excelColumns[0] || "id"}
                showBorders
                columnAutoWidth
                height={400}
              >
                {excelColumns.map((field) => (
                  <Column key={field} dataField={field} caption={field} />
                ))}
              </DataGrid>
            </MDBox>
          )}
        </Paper>
      )}

      {mode === "manual" && (
        <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h6">Define Columns</MDTypography>
            <Button variant="outlined" onClick={addColumn} disabled={!moduleName}>
              Add Column
            </Button>
          </Box>
          {columns.map((c) => (
            <Box key={c.id} display="flex" alignItems="center" gap={2} mb={2}>
              <TextField
                label="Column Name"
                value={c.name}
                onChange={(e) => updateColumn(c.id, "name", e.target.value)}
              />
              <FormControl sx={{ minWidth: 120 }}>
                <Select value={c.type} onChange={(e) => updateColumn(c.id, "type", e.target.value)}>
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={() => removeColumn(c.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Box mt={2}>
            <MDTypography variant="h6" gutterBottom>
              Preview Table
            </MDTypography>
            <DataGrid dataSource={[]} keyExpr="id" showBorders columnAutoWidth>
              {columns.map((c) => (
                <Column
                  key={c.id}
                  dataField={c.name || `col_${c.id}`}
                  caption={c.name || "Unnamed"}
                  dataType={c.type}
                />
              ))}
            </DataGrid>
          </Box>
        </Paper>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={!moduleName || (mode === "excel" ? !excelParsed : columns.length === 0)}
      >
        Create Module
      </Button>
    </MDBox>
  );
}

// pages/ModulePage.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Button from "@mui/material/Button";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import DxDataGrid from "pages/DxDataGrid";
import { PivotGrid } from "devextreme-react";
import { api } from "api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ModulePage({ moduleKey }) {
  // Local state for selected view mode
  const [viewMode, setViewMode] = useState("grid");
  const title = moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);

  const handleExportExcel = async () => {
    try {
      const { data } = await api.get(`/${moduleKey}`);
      if (!data?.length) return;

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(title);

      // set columns from keys
      const cols = Object.keys(data[0]).map((key) => ({ header: key, key }));
      ws.columns = cols;

      // add rows
      data.forEach((row) => ws.addRow(row));

      // auto-size
      ws.columns.forEach((col) => {
        let max = col.header.length;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const v = cell.value?.toString() ?? "";
          if (v.length > max) max = v.length;
        });
        col.width = max + 2;
      });

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `${title}.xlsx`);
    } catch (e) {
      console.error("Excel export failed", e);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { data } = await api.get(`/${moduleKey}`);
      if (!data?.length) return;

      const doc = new jsPDF();
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => row[h]));

      autoTable(doc, {
        head: [headers],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      doc.save(`${title}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

  return (
    <MDBox py={3} px={3}>
      <Card elevation={2}>
        <CardContent>
          {/* Header */}
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mt={1} mb={2}>
            <MDTypography variant="h5">{title}</MDTypography>
            <MDBox display="flex" gap={2}>
              <Button onClick={handleExportExcel}>Export to Excel</Button>
              <Button onClick={handleExportPDF}>Export to PDF</Button>
            </MDBox>
          </MDBox>

          {/* View Mode Selector */}
          <MDBox mt={2} width="200px">
            <FormControl fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { height: 32 } }}>
              <InputLabel id="view-mode-label">View Mode</InputLabel>
              <Select
                labelId="view-mode-label"
                value={viewMode}
                label="View Mode"
                onChange={(e) => setViewMode(e.target.value)}
                sx={{ height: "100%" }}
              >
                <MenuItem value="grid">Grid</MenuItem>
                <MenuItem value="pivot">Pivot</MenuItem>
                <MenuItem value="list">List</MenuItem>
              </Select>
            </FormControl>
          </MDBox>

          {/* Conditionally render based on viewMode */}
          {viewMode === "grid" && <DxDataGrid moduleKey={moduleKey} height={600} />}
          {viewMode === "pivot" && <PivotGrid moduleKey={moduleKey} height={600} />}
          {viewMode === "list" && <div>List view not implemented yet.</div>}
        </CardContent>
      </Card>
    </MDBox>
  );
}

ModulePage.propTypes = {
  moduleKey: PropTypes.string.isRequired,
};

import { useState, useEffect } from "react";
import axios from "axios";

// UI Components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";

// MD Components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    axios.get("http://localhost:1004/api/companies").then((res) => {
      setCompanies(res.data);
    });
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];
    if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const getArrow = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " 🔼" : " 🔽";
  };

  return (
    <MDBox py={3} px={3}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ overflowX: "auto" }}>
            <MDBox p={3}>
              <MDTypography variant="h5" mb={2}>
                Companies
              </MDTypography>
              <TextField
                label="Search by name"
                variant="outlined"
                size="small"
                fullWidth
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Table sx={{ tableLayout: "fixed", minWidth: 800 }} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort("id")} sx={{ cursor: "pointer" }}>
                      ID{getArrow("id")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("name")} sx={{ cursor: "pointer" }}>
                      Company Name{getArrow("name")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("email")} sx={{ cursor: "pointer" }}>
                      Email{getArrow("email")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("type")} sx={{ cursor: "pointer" }}>
                      Company Type{getArrow("type")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>{company.id}</TableCell>
                      <TableCell>{company.name}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>
                        {company.type
                          .split("_")
                          .map((word) => word[0] + word.slice(1).toLowerCase())
                          .join(" ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </MDBox>
          </Card>
        </Grid>
      </Grid>
    </MDBox>
  );
}

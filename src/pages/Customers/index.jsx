import { useEffect, useState } from "react";
import { api } from "api";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TextField from "@mui/material/TextField";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    api
      .get("/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => {
        console.error("Failed to load customers:", err);
      });
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valueA = a[sortConfig.key]?.toString().toLowerCase();
    const valueB = b[sortConfig.key]?.toString().toLowerCase();

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
                Customers
              </MDTypography>
              <TextField
                label="Search by name"
                variant="outlined"
                size="small"
                fullWidth
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Table sx={{ tableLayout: "fixed", minWidth: 750 }} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort("name")} sx={{ cursor: "pointer" }}>
                      Customer Name{getArrow("name")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("email")} sx={{ cursor: "pointer" }}>
                      Email{getArrow("email")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("type")} sx={{ cursor: "pointer" }}>
                      Customer Type{getArrow("type")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        {customer.type
                          ?.split("_")
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

import { useEffect, useState } from "react";
import axios from "axios";

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

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    axios.get("http://localhost:1004/api/invoices").then((res) => {
      setInvoices(res.data);
    });
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredInvoices = invoices.filter((invoice) =>
    `${invoice.id}${invoice.invoiceNumber}${invoice.orderId}`.includes(searchTerm)
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

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
                Invoices
              </MDTypography>
              <TextField
                label="Search by Invoice ID, Number or Order ID"
                variant="outlined"
                size="small"
                fullWidth
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Table sx={{ tableLayout: "fixed", minWidth: 900 }} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort("id")} sx={{ cursor: "pointer" }}>
                      Invoice ID{getArrow("id")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("invoiceNumber")} sx={{ cursor: "pointer" }}>
                      Invoice No.{getArrow("invoiceNumber")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("orderId")} sx={{ cursor: "pointer" }}>
                      Order ID{getArrow("orderId")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("issueDate")} sx={{ cursor: "pointer" }}>
                      Issue Date{getArrow("issueDate")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("status")} sx={{ cursor: "pointer" }}>
                      Status{getArrow("status")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("amount")} sx={{ cursor: "pointer" }}>
                      Amount{getArrow("amount")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.id}</TableCell>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.orderId}</TableCell>
                      <TableCell>
                        {new Date(invoice.issueDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        {invoice.status
                          ?.split("_")
                          .map((word) => word[0] + word.slice(1).toLowerCase())
                          .join(" ")}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
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

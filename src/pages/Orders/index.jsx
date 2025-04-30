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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error("Failed to load orders:", err);
      });
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const filteredOrders = orders.filter((order) =>
    `${order.id}${order.customerId}`.includes(searchTerm)
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
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
                Orders
              </MDTypography>
              <TextField
                label="Search by Order ID or Customer ID"
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
                      Order ID{getArrow("id")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("customerId")} sx={{ cursor: "pointer" }}>
                      Customer ID{getArrow("customerId")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("orderDate")} sx={{ cursor: "pointer" }}>
                      Order Date{getArrow("orderDate")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("status")} sx={{ cursor: "pointer" }}>
                      Status{getArrow("status")}
                    </TableCell>
                    <TableCell onClick={() => handleSort("totalAmount")} sx={{ cursor: "pointer" }}>
                      Total{getArrow("totalAmount")}
                    </TableCell>
                    <TableCell>Items</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.customerId}</TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        {order.status
                          ?.split("_")
                          .map((word) => word[0] + word.slice(1).toLowerCase())
                          .join(" ")}
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>{order.itemIds?.join(", ") || "None"}</TableCell>
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

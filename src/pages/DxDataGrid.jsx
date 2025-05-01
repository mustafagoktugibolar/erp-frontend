// components/DxDataGrid.jsx
import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import DataGrid, {
  Editing,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Sorting,
  Paging,
  Pager,
  Selection,
} from "devextreme-react/data-grid";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import { api } from "api";

export default function DxDataGrid({ moduleKey, height = 600 }) {
  const [columns, setColumns] = useState([]);

  // Create a CustomStore for CRUD operations
  const store = useMemo(
    () =>
      new CustomStore({
        key: "id",
        load: () => api.get(`/${moduleKey}`).then((res) => res.data),
        insert: (newData) => api.post(`/${moduleKey}`, newData).then((res) => res.data),
        update: (key, updatedData) =>
          api.put(`/${moduleKey}/${key}`, updatedData).then((res) => res.data),
        remove: (key) => api.delete(`/${moduleKey}/${key}`),
      }),
    [moduleKey]
  );

  // Wrap the store in a DataSource for the grid
  const dataSource = useMemo(() => new DataSource({ store }), [store]);

  // Generate columns based on loaded data
  useEffect(() => {
    const handleChanged = () => {
      const items = dataSource.items();
      if (items.length > 0) {
        const inferred = Object.keys(items[0]).map((field) => ({
          dataField: field,
          caption: field.charAt(0).toUpperCase() + field.slice(1),
          allowEditing: field !== "id",
        }));
        setColumns(inferred);
      }
    };

    dataSource.on("changed", handleChanged);
    dataSource.load();
    return () => dataSource.off("changed", handleChanged);
  }, [dataSource]);

  return (
    <DataGrid
      dataSource={dataSource}
      columns={columns}
      keyExpr="id"
      showBorders
      columnAutoWidth
      allowColumnResizing
      rowAlternationEnabled
      height={height}
      onRowUpdating={(e) => {
        e.newData = { ...e.oldData, ...e.newData };
      }}
    >
      <Selection mode="single" />
      <Editing mode="row" allowAdding allowUpdating allowDeleting useIcons />
      <SearchPanel visible width={240} placeholder="Search..." />
      <HeaderFilter visible />
      <FilterRow visible />
      <Sorting mode="multiple" />
      <Paging defaultPageSize={10} />
      <Pager visible showPageSizeSelector allowedPageSizes={[20, 30, 50]} showInfo />
    </DataGrid>
  );
}

DxDataGrid.propTypes = {
  moduleKey: PropTypes.string.isRequired,
  height: PropTypes.number,
};

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

export default function DxDataGrid({ moduleKey, moduleId, height = 600 }) {
  const [columns, setColumns] = useState([]);

  // Create a CustomStore for CRUD operations
  const store = useMemo(
    () =>
      new CustomStore({
        key: "id",
        load: () => {
          if (moduleId) {
            return api.get(`/modules/${moduleId}/objects`).then((res) => {
              // Backend returns List<ArcObject> where fields are in 'data' map
              return res.data.map((obj) => ({
                id: obj.arc_object_id,
                ...obj.data,
              }));
            });
          }
          return api.get(`/${moduleKey}`).then((res) => res.data);
        },
        insert: (newData) => {
          if (moduleId) {
            // Construct ArcObject payload
            const payload = { data: newData, moduleId };
            return api.post(`/modules/${moduleId}/objects`, payload).then((res) => ({
              id: res.data.arc_object_id,
              ...res.data.data,
            }));
          }
          return api.post(`/${moduleKey}`, newData).then((res) => res.data);
        },
        update: (key, updatedData) => {
          if (moduleId) {
            // key is the id (arc_object_id)
            // Need to handle partial updates or full updates. DevExtreme passes updated fields.
            // We likely need to merge with existing or send what we have.
            // For now, let's wrap in 'data'.
            const payload = { data: updatedData, moduleId };
            return api.put(`/modules/${moduleId}/objects/${key}`, payload).then((res) => ({
              id: res.data.arc_object_id,
              ...res.data.data,
            }));
          }
          return api.put(`/${moduleKey}/${key}`, updatedData).then((res) => res.data);
        },
        remove: (key) => {
          if (moduleId) {
            return api.delete(`/modules/${moduleId}/objects/${key}`);
          }
          return api.delete(`/${moduleKey}/${key}`);
        },
      }),
    [moduleKey, moduleId]
  );

  // Wrap the store in a DataSource for the grid
  const dataSource = useMemo(() => new DataSource({ store }), [store]);

  // Generate columns based on loaded data OR module definition
  useEffect(() => {
    let isMounted = true;

    const defineColumns = async () => {
      // If columns are already defined, do not redefine/reset them
      if (columns.length > 0) return;

      if (moduleId) {
        try {
          const { data: moduleInfo } = await api.get(`/modules/${moduleId}`);
          if (moduleInfo && moduleInfo.columns && moduleInfo.columns.length > 0 && isMounted) {
            const schemaCols = moduleInfo.columns.map((col) => ({
              dataField: col.name,
              caption: col.label || col.name.charAt(0).toUpperCase() + col.name.slice(1),
              dataType: col.type ? col.type.toLowerCase() : "string",
              allowEditing: true,
            }));
            setColumns(schemaCols);
            return;
          }
        } catch (err) {
          console.warn("Could not fetch module schema", err);
        }
      }

      // Fallback to data inference
      const items = dataSource.items();
      if (items.length > 0 && isMounted) {
        const inferred = Object.keys(items[0]).map((field) => ({
          dataField: field,
          caption: field.charAt(0).toUpperCase() + field.slice(1),
          allowEditing: field !== "id",
        }));
        setColumns(inferred);
      }
    };

    const handleChanged = () => {
      // Only try to define columns if we still don't have them
      if (columns.length === 0) {
        defineColumns();
      }
    };

    // Initial load
    if (columns.length === 0) {
      dataSource.load().then(handleChanged);
      if (moduleId) defineColumns();
    }

    dataSource.on("changed", handleChanged);

    return () => {
      isMounted = false;
      dataSource.off("changed", handleChanged);
    };
  }, [dataSource, moduleId, columns.length]);

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
  moduleId: PropTypes.number,
  height: PropTypes.number,
};

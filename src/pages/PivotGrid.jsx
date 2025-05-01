// components/DXPivotGrid.jsx
import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import PivotGrid, { Field, FieldChooser, FieldPanel } from "devextreme-react/pivot-grid";
import { api } from "api";

export default function DXPivotGrid({ moduleKey, height = 600 }) {
  const [rawData, setRawData] = useState(null);
  const [fields, setFields] = useState(null);

  // 1) fetch the array
  useEffect(() => {
    api
      .get(`/${moduleKey}`)
      .then((res) => {
        const arr = res.data;
        setRawData(arr || []);

        if (Array.isArray(arr) && arr.length > 0) {
          // 2) infer fields once
          const inferred = Object.keys(arr[0]).map((key) => {
            const val = arr[0][key];
            let area;
            if (key === "id") area = "filter";
            else if (typeof val === "number") area = "data";
            else area = "row";

            return {
              dataField: key,
              caption: key.charAt(0).toUpperCase() + key.slice(1),
              area,
              summaryType: area === "data" ? "sum" : undefined,
            };
          });
          setFields(inferred);
        } else {
          setFields([]);
        }
      })
      .catch((err) => {
        console.error("DXPivotGrid load error:", err);
        setRawData([]);
        setFields([]);
      });
  }, [moduleKey]);

  // 3) build the "config object" for PivotGrid
  const dataSourceConfig = useMemo(() => {
    if (!rawData || !fields) return null;
    return { store: rawData, fields };
  }, [rawData, fields]);

  // 4) loading state
  if (!dataSourceConfig) {
    return <div>Loading pivot…</div>;
  }

  return (
    <PivotGrid
      dataSource={dataSourceConfig}
      allowSortingBySummary
      allowFiltering
      showBorders
      height={height}
    >
      {fields.map((f) => (
        <Field
          key={f.dataField}
          dataField={f.dataField}
          caption={f.caption}
          area={f.area}
          summaryType={f.summaryType}
        />
      ))}
      <FieldChooser enabled />
      <FieldPanel visible />
    </PivotGrid>
  );
}

DXPivotGrid.propTypes = {
  moduleKey: PropTypes.string.isRequired,
  height: PropTypes.number,
};

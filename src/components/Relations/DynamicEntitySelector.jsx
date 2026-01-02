import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { SelectBox } from "devextreme-react/select-box";
import { getEntities } from "services/moduleService";

function DynamicEntitySelector({ type, value, onValueChanged, moduleId = null }) {
  console.log("DynamicEntitySelector Render:", { type, value, moduleId });
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("DynamicEntitySelector Effect:", { type, moduleId });
    let isMounted = true;
    if (type) {
      setLoading(true);
      getEntities(type, moduleId)
        .then((data) => {
          console.log("DynamicEntitySelector Fetched:", data);
          if (isMounted) {
            setDataSource(Array.isArray(data) ? data : []);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("DynamicEntitySelector Fetch Error:", err);
          if (isMounted) setLoading(false);
        });
    } else {
      setDataSource([]);
    }
    return () => {
      isMounted = false;
    };
  }, [type, moduleId]);

  // Helper to determine what to show in the dropdown
  const getDisplayExpr = (item) => {
    if (!item) return "";
    return (
      item.name || item.title || item.description || item.email || item.username || `${item.id}`
    );
  };

  return (
    <SelectBox
      dataSource={dataSource}
      value={value}
      valueExpr="id"
      displayExpr={getDisplayExpr}
      searchEnabled={true}
      showClearButton={true}
      placeholder={type ? `Select ${type.toLowerCase()}...` : "Select Type first"}
      noDataText={loading ? "Loading..." : "No data found"}
      onValueChanged={(e) => onValueChanged(e.value)}
      disabled={!type}
    />
  );
}

DynamicEntitySelector.propTypes = {
  type: PropTypes.string,
  value: PropTypes.any,
  onValueChanged: PropTypes.func.isRequired,
  moduleId: PropTypes.number,
};

export default DynamicEntitySelector;

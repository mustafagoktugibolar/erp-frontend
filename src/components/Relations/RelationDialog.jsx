import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Popup } from "devextreme-react/popup";
import { SelectBox } from "devextreme-react/select-box";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import TriggerSettings from "./TriggerSettings";
import { getEntities } from "services/moduleService";

function RelationDialog({ isOpen, onClose, onSave, availableModules, moduleTypes }) {
  // State
  const [sourceType, setSourceType] = useState(null);
  const [targetType, setTargetType] = useState(null);
  const [sourceId, setSourceId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [relationType, setRelationType] = useState("TRIGGER");
  const [settings, setSettings] = useState("{}");

  // Data Sources
  const [sourceEntities, setSourceEntities] = useState([]);
  const [targetEntities, setTargetEntities] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [targetLoading, setTargetLoading] = useState(false);

  // Derived Module IDs (for TriggerSettings)
  const getModuleId = (type) => {
    const mod = availableModules.find((m) => m.name === type || m.type === type);
    return mod ? mod.id : null;
  };

  // Load Source Entities
  useEffect(() => {
    if (!sourceType) {
      setSourceEntities([]);
      setSourceId(null);
      return;
    }
    setSourceLoading(true);
    setSourceId(null); // Reset selection on type change
    const moduleId = getModuleId(sourceType);
    getEntities(sourceType, moduleId)
      .then((data) => setSourceEntities(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load source entities", err))
      .finally(() => setSourceLoading(false));
  }, [sourceType, availableModules]);

  // Load Target Entities
  useEffect(() => {
    if (!targetType) {
      setTargetEntities([]);
      setTargetId(null);
      return;
    }
    setTargetLoading(true);
    setTargetId(null);
    const moduleId = getModuleId(targetType);
    getEntities(targetType, moduleId)
      .then((data) => setTargetEntities(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load target entities", err))
      .finally(() => setTargetLoading(false));
  }, [targetType, availableModules]);

  const handleSave = () => {
    if (!sourceType || !sourceId || !targetType || !targetId) {
      alert("Please fill all required fields (Source Type, Source ID, Target Type, Target ID).");
      return;
    }
    const payload = {
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationType,
      settings,
    };
    console.log("Saving relation payload:", payload);
    onSave(payload);
  };

  const resetForm = useCallback(() => {
    setSourceType(null);
    setTargetType(null);
    setSourceId(null);
    setTargetId(null);
    setRelationType("TRIGGER");
    setSettings("{}");
  }, []);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const displayExpr = (item) =>
    item
      ? item.name || item.title || item.description || item.email || item.username || `${item.id}`
      : "";

  return (
    <Popup
      visible={isOpen}
      onHiding={onClose}
      dragEnabled={true}
      title="Create New Relation"
      width={900}
      height={750}
      showCloseButton={true}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
        {/* Source Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <MDTypography variant="subtitle2">Source Type</MDTypography>
            <SelectBox
              items={moduleTypes}
              value={sourceType}
              onValueChanged={(e) => setSourceType(e.value)}
              placeholder="Select Source Module..."
              searchEnabled
              showClearButton
            />
          </div>
          <div>
            <MDTypography variant="subtitle2">Source ID</MDTypography>
            <SelectBox
              dataSource={sourceEntities}
              value={sourceId}
              valueExpr="id"
              displayExpr={displayExpr}
              disabled={!sourceType}
              placeholder={sourceLoading ? "Loading..." : "Select Source Entity..."}
              onValueChanged={(e) => setSourceId(e.value)}
              searchEnabled
              showClearButton
              noDataText={sourceLoading ? "Loading..." : "No data found"}
            />
          </div>
        </div>

        {/* Target Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <MDTypography variant="subtitle2">Target Type</MDTypography>
            <SelectBox
              items={moduleTypes}
              value={targetType}
              onValueChanged={(e) => setTargetType(e.value)}
              placeholder="Select Target Module..."
              searchEnabled
              showClearButton
            />
          </div>
          <div>
            <MDTypography variant="subtitle2">Target ID</MDTypography>
            <SelectBox
              dataSource={targetEntities}
              value={targetId}
              valueExpr="id"
              displayExpr={displayExpr}
              disabled={!targetType}
              placeholder={targetLoading ? "Loading..." : "Select Target Entity..."}
              onValueChanged={(e) => setTargetId(e.value)}
              searchEnabled
              showClearButton
              noDataText={targetLoading ? "Loading..." : "No data found"}
            />
          </div>
        </div>

        {/* Relation Type */}
        <div>
          <MDTypography variant="subtitle2">Relation Type</MDTypography>
          <SelectBox
            items={["SYNC", "TRIGGER", "LINK"]}
            value={relationType}
            onValueChanged={(e) => setRelationType(e.value)}
          />
        </div>

        {/* Settings */}
        <div
          style={{
            flex: 1,
            minHeight: "300px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "8px",
          }}
        >
          <MDTypography variant="subtitle2" gutterBottom>
            Relation Settings
          </MDTypography>
          <TriggerSettings
            value={settings}
            onValueChanged={(e) => setSettings(e.value)}
            sourceModuleId={getModuleId(sourceType)}
            targetModuleId={getModuleId(targetType)}
          />
        </div>

        {/* Footer Actions */}
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}
        >
          <MDButton onClick={onClose} color="secondary" variant="outlined">
            Cancel
          </MDButton>
          <MDButton onClick={handleSave} color="info" variant="gradient">
            Save Relation
          </MDButton>
        </div>
      </div>
    </Popup>
  );
}

RelationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  availableModules: PropTypes.array.isRequired,
  moduleTypes: PropTypes.array.isRequired,
};

export default RelationDialog;

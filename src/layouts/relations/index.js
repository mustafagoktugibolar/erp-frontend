/* eslint-disable */
import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { DataGrid, Column, Editing, Popup, Form, Item } from "devextreme-react/data-grid";
import { getRelations, createRelation, deleteRelation } from "services/arcRelationService";
import {
  getModules,
  getObjectDetails,
  getEntities,
  getModuleDetails,
} from "services/moduleService";
import TriggerSettings from "components/Relations/TriggerSettings";
import DynamicEntitySelector from "components/Relations/DynamicEntitySelector";
import RelationDialog from "components/Relations/RelationDialog";
import { SelectBox } from "devextreme-react/select-box";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card } from "@mui/material";
import "devextreme/dist/css/dx.light.css";

function RelationManager() {
  const [relations, setRelations] = useState([]);
  const [moduleTypes, setModuleTypes] = useState([]);
  const [availableModules, setAvailableModules] = useState([]); // Store full module objects (id, name)
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]); // Changed to array for DataGrid
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const [sourceColumns, setSourceColumns] = useState([]);
  const [targetColumns, setTargetColumns] = useState([]);

  // Track the form state manually to ensure reactivity for dependent fields

  useEffect(() => {
    loadRelations();
    loadModules();
  }, []);

  const loadRelations = useCallback(async () => {
    try {
      const data = await getRelations();
      setRelations(data);
    } catch (error) {
      console.error("Failed to load relations", error);
    }
  }, []);
  const loadModules = async () => {
    try {
      const modules = await getModules();
      if (Array.isArray(modules) && modules.length > 0) {
        const fetchedTypes = modules.map((m) => (typeof m === "string" ? m : m.name || m.type));
        // Merge with defaults to ensure core types always exist
        // User requested NO defaults (no COMPANY etc if not in backend)
        setModuleTypes(fetchedTypes);
        setAvailableModules(modules);
      }
    } catch (e) {
      console.warn("Retaining default module types due to error", e);
    }
  };

  const handleCreateRelation = useCallback(async (payload) => {
    try {
      console.log("Creating relation with payload:", payload);
      // Backend expects string IDs
      const sanitizedPayload = {
        ...payload,
        sourceId: String(payload.sourceId),
        targetId: String(payload.targetId),
        relationType: payload.relationType || "SYNC", // Default
        settings: payload.settings || "{}"
      };

      await createRelation(sanitizedPayload);
      setDialogOpen(false);
      loadRelations();
    } catch (error) {
      console.error("Failed to create relation", error);
      alert(`Failed to create relation: ${error.message || "Unknown error"}`);
    }
  }, [loadRelations]);

  const onRowRemoved = useCallback(async (e) => {
    try {
      await deleteRelation(e.data.id);
    } catch (error) {
      console.error("Failed to delete relation", error);
    }
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Relations Manager
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={() => setDialogOpen(true)}>
                  + New Relation
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataGrid
                  dataSource={relations}
                  showBorders={true}
                  onRowRemoved={onRowRemoved}
                >
                  <Editing
                    mode="popup"
                    allowUpdating={false}
                    allowAdding={false}
                    allowDeleting={true}
                    useIcons={true}
                  />

                  <Column dataField="id" caption="ID" width={50} />
                  <Column dataField="sourceType" caption="Source Type" />
                  <Column dataField="sourceId" caption="Source ID" width={100} />
                  <Column dataField="targetType" caption="Target Type" />
                  <Column dataField="targetId" caption="Target ID" width={100} />
                  <Column dataField="relationType" caption="Rel Type" />
                  <Column dataField="settings" caption="Settings (JSON)" visible={false} />
                </DataGrid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <br />
      <br /> <br /> <br /> <br />

      <RelationDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleCreateRelation}
        availableModules={availableModules}
        moduleTypes={moduleTypes}
      />
    </DashboardLayout>
  );
}

export default RelationManager;

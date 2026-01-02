/* eslint-disable */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { DataGrid, Column, Editing } from "devextreme-react/data-grid";
import { SelectBox } from "devextreme-react/select-box";
import TextField from "@mui/material/TextField";
import { getModuleDetails } from "services/moduleService";

function TriggerSettings({ value, onValueChanged, sourceModuleId, targetModuleId, isGlobal }) {
    const [triggerField, setTriggerField] = useState("");
    const [targetField, setTargetField] = useState("");

    // Join Keys for Global Rules
    const [joinKeySource, setJoinKeySource] = useState("");
    const [joinKeyTarget, setJoinKeyTarget] = useState("");

    const [mappings, setMappings] = useState([]);

    const [sourceColumns, setSourceColumns] = useState([]);
    const [targetColumns, setTargetColumns] = useState([]);

    // Fetch columns when IDs change
    useEffect(() => {
        let mounted = true;
        const fetchCols = async (moduleId, setFn) => {
            if (!moduleId) {
                setFn([]);
                return;
            }
            try {
                const details = await getModuleDetails(moduleId);
                if (mounted && details && details.columns) {
                    setFn(details.columns.map(c => c.name));
                }
            } catch (e) {
                console.warn("Failed to fetch columns", e);
            }
        };

        fetchCols(sourceModuleId, setSourceColumns);
        fetchCols(targetModuleId, setTargetColumns);

        return () => { mounted = false; };
    }, [sourceModuleId, targetModuleId]);

    useEffect(() => {
        try {
            if (value) {
                const parsed = JSON.parse(value);
                setTriggerField((prev) => (parsed.triggerField !== prev ? parsed.triggerField || "" : prev));
                setTargetField((prev) => (parsed.targetField !== prev ? parsed.targetField || "" : prev));
                setJoinKeySource((prev) => (parsed.joinKeySource !== prev ? parsed.joinKeySource || "" : prev));
                setJoinKeyTarget((prev) => (parsed.joinKeyTarget !== prev ? parsed.joinKeyTarget || "" : prev));

                const mapArray = [];
                if (parsed.valueMapping) {
                    Object.keys(parsed.valueMapping).forEach((k, i) => {
                        mapArray.push({ id: i, sourceValue: k, targetValue: parsed.valueMapping[k] });
                    });
                }
                setMappings(mapArray);
            }
        } catch (e) {
            console.error("Invalid JSON in settings", e);
        }
    }, [value]);

    const handleUpdate = (newTrigger, newTarget, newMappings, newJoinSrc, newJoinTgt) => {
        const valueMapping = {};
        (newMappings || mappings).forEach((m) => {
            if (m.sourceValue && m.targetValue) {
                valueMapping[m.sourceValue] = m.targetValue;
            }
        });

        const settingsObj = {
            triggerField: newTrigger !== undefined ? newTrigger : triggerField,
            targetField: newTarget !== undefined ? newTarget : targetField,
            joinKeySource: newJoinSrc !== undefined ? newJoinSrc : joinKeySource,
            joinKeyTarget: newJoinTgt !== undefined ? newJoinTgt : joinKeyTarget,
            valueMapping,
        };

        onValueChanged({ value: JSON.stringify(settingsObj) });
    };

    const updateMappings = (newMappings) => {
        setMappings(newMappings);
        handleUpdate(undefined, undefined, newMappings, undefined, undefined);
    };

    const fieldSelectorProps = {
        acceptCustomValue: true,
        searchEnabled: true,
        onCustomItemCreating: (e) => {
            if (!e.text) {
                e.customItem = null;
                return;
            }
            e.customItem = e.text;
        },
    };

    return (
        <MDBox p={2} border="1px solid #ccc" borderRadius="lg">
            <MDTypography variant="h6">Smart Trigger Rules</MDTypography>

            {/* Standard Fields */}
            <MDBox display="flex" gap={2} mb={2}>
                <MDBox width="100%">
                    <MDTypography variant="caption" fontWeight="bold">
                        Trigger Field (Source)
                    </MDTypography>
                    <SelectBox
                        items={sourceColumns || []}
                        value={triggerField}
                        onValueChanged={(e) => {
                            setTriggerField(e.value);
                            handleUpdate(e.value, undefined, undefined, undefined, undefined);
                        }}
                        placeholder="Select or type field..."
                        {...fieldSelectorProps}
                    />
                </MDBox>

                <MDBox width="100%">
                    <MDTypography variant="caption" fontWeight="bold">
                        Target Field (Destination)
                    </MDTypography>
                    <SelectBox
                        items={targetColumns || []}
                        value={targetField}
                        onValueChanged={(e) => {
                            setTargetField(e.value);
                            handleUpdate(undefined, e.value, undefined, undefined, undefined);
                        }}
                        placeholder="Select or type field..."
                        {...fieldSelectorProps}
                    />
                </MDBox>
            </MDBox>

            {/* Global Join Keys */}
            {isGlobal && (
                <MDBox display="flex" gap={2} mb={2} p={2} bgcolor="#f5f5f5" borderRadius="md">
                    <MDBox width="100%">
                        <MDTypography variant="caption" fontWeight="bold" color="primary">
                            Match By Source Field (Join Key)
                        </MDTypography>
                        <SelectBox
                            items={sourceColumns || []}
                            value={joinKeySource}
                            onValueChanged={(e) => {
                                setJoinKeySource(e.value);
                                handleUpdate(undefined, undefined, undefined, e.value, undefined);
                            }}
                            placeholder="e.g. project_code"
                            {...fieldSelectorProps}
                        />
                    </MDBox>
                    <MDBox width="100%">
                        <MDTypography variant="caption" fontWeight="bold" color="primary">
                            Match Target Field (Join Key)
                        </MDTypography>
                        <SelectBox
                            items={targetColumns || []}
                            value={joinKeyTarget}
                            onValueChanged={(e) => {
                                setJoinKeyTarget(e.value);
                                handleUpdate(undefined, undefined, undefined, undefined, e.value);
                            }}
                            placeholder="e.g. linked_project_id"
                            {...fieldSelectorProps}
                        />
                    </MDBox>
                </MDBox>
            )}

            <MDTypography variant="caption" fontWeight="bold">
                Value Mappings
            </MDTypography>
            <DataGrid
                dataSource={mappings}
                keyExpr="id"
                showBorders={true}
                height={200}
                onRowInserted={(e) =>
                    updateMappings([
                        ...mappings,
                        {
                            ...e.data,
                            id: mappings.length > 0 ? Math.max(...mappings.map((m) => m.id)) + 1 : 1,
                        },
                    ])
                }
                onRowUpdated={(e) => {
                    const updated = mappings.map((m) => (m.id === e.key ? { ...m, ...e.data } : m));
                    updateMappings(updated);
                }}
                onRowRemoved={(e) => {
                    const updated = mappings.filter((m) => m.id !== e.key);
                    updateMappings(updated);
                }}
            >
                <Editing mode="row" allowUpdating={true} allowAdding={true} allowDeleting={true} />
                <Column dataField="sourceValue" caption="If Source Equals..." />
                <Column dataField="targetValue" caption="Set Target To..." />
            </DataGrid>
        </MDBox>
    );
}

TriggerSettings.propTypes = {
    value: PropTypes.string,
    onValueChanged: PropTypes.func.isRequired,
    sourceModuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    targetModuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isGlobal: PropTypes.bool,
};

export default TriggerSettings;

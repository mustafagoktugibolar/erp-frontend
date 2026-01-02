import { api } from "../api";

export const getModules = async () => {
  try {
    const response = await api.get("/modules");
    // Assuming response.data is an array of modules or strings
    return response.data;
  } catch (error) {
    console.warn("Failed to fetch modules, falling back to defaults", error);
    return [];
  }
};
// Fetch details for a specific module (schema, columns etc.)
export const getModuleDetails = async (id) => {
  const response = await api.get(`/modules/${id}`);
  return response.data;
};

export const getObjectDetails = async (type, id) => {
  const endpoint = `/${type.toLowerCase()}s/${id}`;
  let urlPart = type.toLowerCase();
  if (!urlPart.endsWith("s")) urlPart += "s";

  const response = await api.get(`/${urlPart}/${id}`);
  return response.data;
};

// Helper to extract array from various response formats
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content; // Spring Page
  if (data && Array.isArray(data.data)) return data.data; // Common wrapper
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

export const getEntities = async (type, moduleId = null) => {
  if (!type) return [];

  const LEGACY_MODULES = ["companies", "customers", "products", "orders", "invoices"];
  const isLegacy = LEGACY_MODULES.includes(type.toLowerCase());

  // If moduleId is provided AND it's NOT a legacy module, use the dynamic module endpoint
  if (moduleId && !isLegacy) {
    try {
      const response = await api.get(`/modules/${moduleId}/objects`);
      // Arc objects return { data: {...}, ... } but wrapped in response
      // Commonly returns List<ArcObjectDTO> which has 'data' map.
      // We need to flatten it for display like DxDataGrid does.
      const rawData = extractArray(response.data);
      return rawData.map((obj) => ({
        id: obj.arc_object_id || obj.id,
        ...obj.data,
      }));
    } catch (error) {
      console.error(`Failed to fetch entities for module ${moduleId}`, error);
      return [];
    }
  }

  // Default pluralization for standard hardcoded types (Legacy Path)
  let urlPart = type.toLowerCase();

  // Custom overrides
  // Removed hardcoded overrides (COMPANY, ARC_OBJECT) per user request
  if (!urlPart.endsWith("s")) urlPart += "s";

  try {
    const response = await api.get(`/${urlPart}`);
    const data = extractArray(response.data);
    return data;
  } catch (error) {
    // ... fallback logic (singular retry etc) ...
    if (error.response && error.response.status === 404) {
      try {
        const singularPart = type.toLowerCase();
        console.warn(`Plural endpoint /${urlPart} failed, trying singular /${singularPart}`);
        const retryResponse = await api.get(`/${singularPart}`);
        return extractArray(retryResponse.data);
      } catch (retryError) {
        console.error(
          `Failed to fetch entities for ${type} (both plural and singular)`,
          retryError
        );
        return [];
      }
    }
    console.warn(`Failed to fetch entities for ${type}`, error);
    return [];
  }
};

import { ClientFileDefinitions } from "@/types/api";

export const getClientFileDefinitions = async (clientId: string) => {
    const response = await DataQualityApi.get(`/api/clients/${clientId}/file-definitions`);
    return response.data; // This should return an array
};

export async function postClientFileDefinitions(clientId: string, payload: ClientFileDefinitions) {
    const response = await DataQualityApi.post(`/api/clients/${clientId}/file-definitions`, payload);
    return response.data;
}

// New API functions for dropdown data
export async function getFileTypes() {
    const response = await DataQualityApi.get(`/api/clients/file-types`);
    return response.data;
}

export async function getTokenTypes() {
    const response = await DataQualityApi.get(`/api/clients/token-types`);
    return response.data;
}

export async function getFieldTypes() {
    const response = await DataQualityApi.get(`/api/clients/field-types`);
    return response.data;
}

export const getRecordMatchCriteria = async (clientId: string) => {
    const token = sessionStorage.getItem("accessToken"); // or localStorage.getItem(...) if that’s what you use
    const response = await DataQualityApi.get(
        `/api/clients/${clientId}/record-match-criteria`,
    );
    if (!response.ok) throw new Error("Failed to fetch RMC");
    return response.json();
};

export const createFieldDefinition = async (definitionId: string, fieldDefinition: any) => {
    const response = await DataQualityApi.post(
        `/api/client-file-definitions/${definitionId}/field-definitions`,
        fieldDefinition
    );
    return response.data;
};

export const updateFieldDefinition = async (fieldDefinitionId: string, updates: any) => {
    const response = await DataQualityApi.put(
        `/api/field-definitions/${fieldDefinitionId}`,
        updates
    );
    return response.data;
};

export const deleteFieldDefinition = async (fieldDefinitionId: string) => {
    const response = await DataQualityApi.delete(`/api/field-definitions/${fieldDefinitionId}`);
    return response.data;
};
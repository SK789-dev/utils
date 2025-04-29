import { ClientFileDefinitions } from "@/types/api";
import axios from "axios";

export const getClientFileDefinitions = async (clientId: string) => {
    const response = await axios.get(`/api/clients/${clientId}/file-definitions`);
    return response.data; // This should return an array
};

export async function postClientFileDefinitions(clientId: string, payload: ClientFileDefinitions) {
    const response = await axios.post(`/api/clients/${clientId}/file-definitions`, payload);
    return response.data;
}

// New API functions for dropdown data
export async function getFileTypes() {
    const response = await axios.get(`/api/clients/file-types`);
    return response.data;
}

export async function getTokenTypes() {
    const response = await axios.get(`/api/clients/token-types`);
    return response.data;
}

export async function getFieldTypes() {
    const response = await axios.get(`/api/clients/field-types`);
    return response.data;
}
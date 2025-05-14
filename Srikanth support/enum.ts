import DataQualityApi from ".";
export async function getFileTypes() {
    const response = await DataQualityApi.get<string[]>(`/file-types`);
    return response.data;
}
export async function getTokenTypes() {
    const response = await DataQualityApi.get<string[]>(`/token-types`);
    return response.data;
}
export async function getFieldTypes() {
    const response = await DataQualityApi.get<string[]>(`/field-types`);
    return response.data;
}
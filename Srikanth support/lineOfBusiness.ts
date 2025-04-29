import { DataQualityApi } from ".";

export interface LineOfBusiness {
    value: string;
    label: string;
}

export async function getLinesOfBusiness() {
    const res = await DataQualityApi.get<LineOfBusiness[]>(`/api/lines-of-business`);
    return res?.data;
}
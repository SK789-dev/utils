import { updateClientFileDefinition } from "@/api/clientFileDefinitions";
import { getFileTypes } from "@/api/enums";
import { getLinesOfBusiness } from "@/api/linesOfBusiness";
import { fetchRecordMatchCriteriaForFileDefinition } from "@/api/recordMatchCriteria";
import { ClientFileDefinition } from "@/types/api";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ClientFileFieldDefinitionList from "./ClientFileFieldDefinition";
import RecordMatchCriteriaList from "./RecordMatchCriteriaList";
export type ClientFileDefinitionGridItemProps = {
    fileDefinition: ClientFileDefinition;
    onFileDefinitionUpdated: (fileDefinition: ClientFileDefinition) => void;
};


function ClientFileDefinitionGridItem({
    fileDefinition,
    onFileDefinitionUpdated,
}: ClientFileDefinitionGridItemProps) {
    const [editingDefinition, setEditingDefinition] =
        useState<ClientFileDefinition | null>(null);
    const [showFieldDefinitions, setShowFieldDefinitions] = useState(false);
    const { data: linesOfBusiness = [] } = useQuery({
        queryKey: ["linesOfBusiness"],
        queryFn: async () => getLinesOfBusiness(),
    });
    const { data: fileTypes = [] } = useQuery({
        queryKey: ["fileTypes"],
        queryFn: async () => getFileTypes(),
    });
    const {
        data: recordMatchCriteriaForFileDefinition = [],
        refetch: refetchRecordMatchCriteriaForFileDefinition,
    } = useQuery({
        queryKey: ["recordMatchCriteriaForFileDefinition", fileDefinition.id],
        queryFn: () => fetchRecordMatchCriteriaForFileDefinition(fileDefinition.id),
    });
    const handleCancelEdit = () => {
        setEditingDefinition(null);
    };
    useEffect(() => { }, [recordMatchCriteriaForFileDefinition]);

    return (
        <>
            {editingDefinition ? (
                <TextField
                    fullWidth
                    label="File Definition Name"
                    value={editingDefinition?.name || ""}
                    onChange={(e) =>
                        setEditingDefinition({
                            ...editingDefinition,
                            name: e.target.value,
                        })
                    }
                />
            ) : (
                <Typography variant="h6" fontWeight="bold">
                    {fileDefinition.name || "File Name"}
                </Typography>
            )}
            {editingDefinition ? (
                <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Line of Business</InputLabel>
                    <Select
                        value={editingDefinition?.lineOfBusiness || ""}
                        label="Line of Business"
                        onChange={(e) =>
                            setEditingDefinition({
                                ...editingDefinition,
                                lineOfBusiness: e.target.value,
                            })
                        }
                    >
                        {linesOfBusiness.map((lob) => (
                            <MenuItem key={lob} value={lob}>
                                {lob}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ) : (
                <Typography variant="body2">
                    LOB: <b>{fileDefinition.lineOfBusiness}</b>
                </Typography>
            )}

            {editingDefinition ? (
                <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>File Type</InputLabel>
                    <Select
                        value={editingDefinition?.fileType || ""}
                        label="File Type"
                        onChange={(e) =>
                            setEditingDefinition({
                                ...editingDefinition,
                                fileType: e.target.value,
                            })
                        }
                    >
                        {fileTypes.map((fileType) => (
                            <MenuItem key={fileType} value={fileType}>
                                {fileType}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ) : (
                <Typography variant="body2">
                    File Type: <b>{fileDefinition.fileType}</b>
                </Typography>
            )}
            {editingDefinition ? (
                <>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        Base Record Field Paths
                    </Typography>
                    {editingDefinition?.baseRecordFieldPaths?.map((path, pathIndex) => (
                        <TextField
                            key={pathIndex}
                            label={`Path ${pathIndex + 1}`}
                            fullWidth
                            margin="dense"
                            value={path}
                            onChange={(e) => {
                                const updatedPaths = [
                                    ...(editingDefinition.baseRecordFieldPaths ?? []),
                                ];

                                updatedPaths[pathIndex] = e.target.value;
                                setEditingDefinition({
                                    ...editingDefinition,
                                    baseRecordFieldPaths: updatedPaths,
                                });
                            }}
                        />
                    ))}
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() =>
                            setEditingDefinition({
                                ...editingDefinition,
                                baseRecordFieldPaths: [
                                    ...(editingDefinition?.baseRecordFieldPaths ?? []),
                                    "",
                                ],
                            })
                        }
                    >
                        + Add Base Record Field Path
                    </Button>
                </>
            ) : (
                <Typography variant="body2">
                    Base Record Field Paths:{" "}
                    <b>{fileDefinition.baseRecordFieldPaths?.join(", ") || "None"}</b>
                </Typography>
            )}
            <Typography variant="body2">
                Field Definitions: <b>{fileDefinition.fieldDefinitions?.length || 0}</b>
            </Typography>
            <Typography variant="body2">
                File Name Tokens: <b>{fileDefinition.fileNameTokens?.length || 0}</b>
            </Typography>
            <Box sx={{ mt: 2 }}>
                {editingDefinition ? (
                    <>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() => {
                                updateClientFileDefinition(
                                    editingDefinition.id,

                                    editingDefinition
                                ).then((data) => {
                                    const updatedItem = {
                                        ...editingDefinition,
                                        ...data,
                                        id: editingDefinition?.id,
                                    };
                                    onFileDefinitionUpdated(updatedItem);
                                    setEditingDefinition(null);
                                });
                            }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="contained"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => setEditingDefinition({ ...fileDefinition })}
                    >
                        Edit
                    </Button>
                )}
                <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowFieldDefinitions(!showFieldDefinitions)}
                >
                    {showFieldDefinitions
                        ? "Hide Field Definitions"
                        : "View Field Definitions"}
                </Button>
            </Box>
            {fileDefinition.baseRecordFieldPaths &&
                fileDefinition.baseRecordFieldPaths.length > 0 && (
                    <RecordMatchCriteriaList
                        fileDefinition={fileDefinition}
                        rmcList={recordMatchCriteriaForFileDefinition}
                        onRecordMatchCriteriaUpdated={() =>
                            refetchRecordMatchCriteriaForFileDefinition()
                        }
                    />
                )}

            {showFieldDefinitions && (
                <Box sx={{ mt: 3, pl: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                        Field Definitions
                    </Typography>
                    {fileDefinition.fieldDefinitions &&
                        fileDefinition.fieldDefinitions.length > 0 ? (
                        <ClientFileFieldDefinitionList
                            fieldDefinitions={fileDefinition.fieldDefinitions}
                            fileDefinitionName={fileDefinition.name}
                            fileType={fileDefinition.fileType}
                            clientFileDefinitionId={fileDefinition.id}
                        />
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No field definitions to display.
                        </Typography>
                    )}
                </Box>
            )}
        </>
    );
}
export default ClientFileDefinitionGridItem;
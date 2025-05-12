import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Box,
    CircularProgress,
    Container,
    Typography,
    Paper,
    Grid,
    Alert,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent,
} from "@mui/material";
import { useState, useEffect } from "react";
import {
    getClientFileDefinitions,
    postClientFileDefinitions,
    updateClientFileDefinitions,
    getFileTypes,
    getTokenTypes,
    getFieldTypes,
    postRecordMatchCriteria,
    getRecordMatchCriteria,
    getAllRecordMatchCriteria,
} from "@/api/clients/clientFileDefinitions";
import { getLinesOfBusiness } from "@/api/lineOfBusiness";
import { ClientFileDefinitions as ClientFileDefinitionsType } from "@/types/api";
import ClientFileFieldDefinitions from "@/components/ClientFieldDefinitions";
import { RecordMatchCriteriaForm } from "./RecordMatchCriteriaForm";
import { RecordMatchCriteriaView } from "./RecordMatchCriteriaView";

interface FileNameToken {
    type: string;
    token: string;
    tokenOrder: number;
}

interface FieldDefinition {
    name: string;
    key: string;
    fieldType: string;
    startPosition: number;
    endPosition: number;
    compositeKeyOrder: number;
    path: string;
}

interface DropdownOption {
    value: string;
    label: string;
}

interface NewDefinition {
    name: string;
    lineOfBusiness: string;
    fileType: string;
    fileNameTokens: FileNameToken[];
    fieldDefinitions: FieldDefinition[];
}

function ClientFileDefinitions() {
    const [editingDefinitionId, setEditingDefinitionId] = useState<string | number | null>(null);
    const [editingDefinition, setEditingDefinition] = useState<Partial<ClientFileDefinitionsType> | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const { clientId } = useParams<{ clientId: string }>();
    const location = useLocation();
    const { clientName, clientCode } = location.state || {};
    const [fileDefinitions, setFileDefinitions] = useState<ClientFileDefinitionsType[]>([]);
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [expandedDefinitionId, setExpandedDefinitionId] = useState<string | number | null>(null);
    const [lineOfBusinessOptions, setLineOfBusinessOptions] = useState<DropdownOption[]>([]);
    const [fileTypeOptions, setFileTypeOptions] = useState<DropdownOption[]>([]);
    const [tokenTypeOptions, setTokenTypeOptions] = useState<DropdownOption[]>([]);
    const [fieldTypeOptions, setFieldTypeOptions] = useState<DropdownOption[]>([]);
    const [rmcMap, setRmcMap] = useState<Record<string, any[]>>({});
    const [loadingRmcId, setLoadingRmcId] = useState<string | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["clientFileDefinitions", clientId],
        queryFn: () =>
            clientId ? getClientFileDefinitions(clientId) : Promise.resolve([]),
        enabled: !!clientId,
    });

    const { data: allRMCs } = useQuery({
        queryKey: ["recordMatchCriteria", clientId],
        queryFn: () => clientId ? getAllRecordMatchCriteria(clientId) : Promise.resolve([]),
        enabled: !!clientId,
    });

    const rmcGroupedByDefinitionId = useMemo(() => {
        const map: Record<string, any[]> = {};
        allRMCs?.forEach((rmc) => {
            if (!map[rmc.clientFileDefinitionId]) {
                map[rmc.clientFileDefinitionId] = [];
            }
            map[rmc.clientFileDefinitionId].push(rmc);
        });
        return map;
    }, [allRMCs]);

    useEffect(() => {
        if (data) {
            setFileDefinitions(Array.isArray(data) ? data : []);
        }
    }, [data]);

    useEffect(() => {
        async function fetchDropdownOptions() {
            try {
                const [lobs, fileTypes, tokenTypes, fieldTypes] = await Promise.all([
                    getLinesOfBusiness(),
                    getFileTypes(),
                    getTokenTypes(),
                    getFieldTypes(),
                ]);

                setLineOfBusinessOptions(lobs.map(line => ({ value: line, label: line })));
                setFileTypeOptions(fileTypes.map(type => ({ value: type, label: type })));
                setTokenTypeOptions(tokenTypes.map(type => ({ value: type, label: type })));
                setFieldTypeOptions(fieldTypes.map(type => ({ value: type, label: type })));
            } catch (error) {
                console.error("Failed to fetch dropdown options:", error);
            }
        }

        fetchDropdownOptions();
    }, []);

    const [newDefinition, setNewDefinition] = useState<NewDefinition>({
        name: "",
        lineOfBusiness: "",
        fileType: "",
        fileNameTokens: [],
        fieldDefinitions: [],
    });

    const mutation = useMutation({
        mutationFn: () => {
            const payload = {
                name: newDefinition.name,
                lineOfBusiness: newDefinition.lineOfBusiness,
                fileType: newDefinition.fileType,
                ...(newDefinition.fileNameTokens.length > 0 && {
                    fileNameTokens: newDefinition.fileNameTokens,
                }),
                ...(newDefinition.fieldDefinitions.length > 0 && {
                    fieldDefinitions: newDefinition.fieldDefinitions,
                }),
            };
            return clientId
                ? postClientFileDefinitions(clientId, payload as ClientFileDefinitionsType)
                : Promise.resolve({});
        },
        onSuccess: () => {
            if (clientId) {
                queryClient.invalidateQueries({
                    queryKey: ["clientFileDefinitions", clientId],
                });
            }
            setNewDefinition({
                name: "",
                lineOfBusiness: "",
                fileType: "",
                fileNameTokens: [],
                fieldDefinitions: [],
            });
            setShowAddForm(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            editingDefinition?.id
                ? updateClientFileDefinitions(
                    editingDefinition.id.toString(),
                    editingDefinition
                )
                : Promise.resolve({}),
        onSuccess: (data) => {
            const updatedItem = {
                ...editingDefinition,
                ...data,
                id: editingDefinition?.id,
            };
            if (editingIndex !== null) {
                setFileDefinitions((prev) => {
                    const updated = [...prev];
                    updated[editingIndex] = JSON.parse(JSON.stringify(updatedItem));
                    return updated;
                });
            }
            setEditingDefinitionId(null);
            setEditingDefinition(null);
            setEditingIndex(null);
        },
    });

    const handleEditClick = (definition: ClientFileDefinitionsType, index: number) => {
        setEditingDefinitionId(definition.id || index);
        setEditingDefinition({ ...definition });
        setEditingIndex(index);
    };

    const handleCancelEdit = () => {
        setEditingDefinitionId(null);
        setEditingDefinition(null);
        setEditingIndex(null);
    };

    const handleSaveEdit = () => {
        if (editingDefinition) {
            updateMutation.mutate();
        }
    };

    const handleAddFileNameToken = () => {
        const nextOrder = newDefinition.fileNameTokens.length;
        setNewDefinition((prev) => ({
            ...prev,
            fileNameTokens: [
                ...(prev.fileNameTokens || []),
                { type: "", token: "", tokenOrder: nextOrder },
            ],
        }));
    };

    const handleAddFieldDefinition = () => {
        const nextOrder = newDefinition.fieldDefinitions.length;
        setNewDefinition((prev) => ({
            ...prev,
            fieldDefinitions: [
                ...(prev.fieldDefinitions || []),
                {
                    name: "",
                    key: "",
                    fieldType: "",
                    startPosition: 0,
                    endPosition: 0,
                    compositeKeyOrder: nextOrder,
                    path: "",
                },
            ],
        }));
    };

    const handleToggleFieldDefinitions = (definitionId: string | number) => {
        setExpandedDefinitionId(
            expandedDefinitionId === definitionId ? null : definitionId
        );
    };

    const handleSave = () => {
        if (
            newDefinition.name.trim() === "" ||
            newDefinition.lineOfBusiness.trim() === "" ||
            newDefinition.fileType.trim() === ""
        ) {
            alert("Name, Line of Business, and File Type are required.");
            return;
        }
        if (
            newDefinition.fileNameTokens.length === 0 &&
            newDefinition.fieldDefinitions.length === 0
        ) {
            const confirmSave = window.confirm(
                "No File Name Tokens or Field Definitions added. Do you still want to save?"
            );
            if (!confirmSave) return;
        }
        mutation.mutate();
    };

    const handleViewRMC = async (definitionId: string) => {
        setLoadingRmcId(definitionId);
        try {
            const data = await getRecordMatchCriteria(clientId);
            setRmcMap((prev) => ({
                ...prev,
                [definitionId]: data,
            }));
        } catch (err) {
            console.error("Failed to load RMC for definition:", definitionId, err);
        } finally {
            setLoadingRmcId(null);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                    }}
                >
                    <Typography variant="h5" component="h1">
                        <Link
                            to={`/clients/${clientId}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            {clientName || "Client"}
                            {clientCode ? ` (${clientCode})` : ""}
                        </Link>{" "}
                        – File Definitions
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => setShowAddForm((prev) => !prev)}
                    >
                        {showAddForm ? "Close" : "+ Add File Definition"}
                    </Button>
                </Box>

                {isLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {isError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        Failed to load file definitions. Please try again.
                    </Alert>
                )}

                {showAddForm && (
                    <Box sx={{ mt: 3, mb: 4, p: 2, border: "1px solid #ccc" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Add New File Definition
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="File Definition Name"
                                    value={newDefinition.name}
                                    onChange={(e) =>
                                        setNewDefinition({ ...newDefinition, name: e.target.value })
                                    }
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Line of Business</InputLabel>
                                    <Select
                                        value={newDefinition.lineOfBusiness}
                                        label="Line of Business"
                                        onChange={(e) => setNewDefinition({ ...newDefinition, lineOfBusiness: e.target.value })}
                                    >
                                        {lineOfBusinessOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={4}>
                                <FormControl fullWidth>
                                    <InputLabel>File Type</InputLabel>
                                    <Select
                                        value={newDefinition.fileType}
                                        label="File Type"
                                        onChange={(e) => setNewDefinition({ ...newDefinition, fileType: e.target.value })}
                                    >
                                        {fileTypeOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Button
                            sx={{ mr: 2 }}
                            variant="outlined"
                            onClick={handleAddFileNameToken}
                        >
                            Add File Name Token
                        </Button>

                        {newDefinition.fileNameTokens?.map((field, index) => (
                            <Grid container spacing={2} key={`token-${index}`} sx={{ mb: 2 }}>
                                <Grid item xs={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Token Type</InputLabel>
                                        <Select
                                            value={field.type}
                                            label="Token Type"
                                            onChange={(e: SelectChangeEvent) => {
                                                const updated = [...newDefinition.fileNameTokens];
                                                updated[index].type = e.target.value;
                                                setNewDefinition((prev) => ({
                                                    ...prev,
                                                    fileNameTokens: updated,
                                                }));
                                            }}
                                        >
                                            {tokenTypeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="File Name Token"
                                        value={field.token}
                                        onChange={(e) => {
                                            const updated = [...newDefinition.fileNameTokens];
                                            updated[index].token = e.target.value;
                                            setNewDefinition({
                                                ...newDefinition,
                                                fileNameTokens: updated,
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="File Name Token Order"
                                        type="number"
                                        value={field.tokenOrder + 1}
                                        disabled
                                    />
                                </Grid>
                            </Grid>
                        ))}

                        <Button
                            sx={{ m: 2, ml: 1 }}
                            variant="outlined"
                            onClick={handleAddFieldDefinition}
                        >
                            Add Field Definition
                        </Button>

                        {newDefinition.fieldDefinitions?.map((field, index) => (
                            <Grid container spacing={2} key={`field-${index}`} sx={{ mb: 2 }}>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="Field Name"
                                        value={field.name}
                                        onChange={(e) => {
                                            const updated = [...newDefinition.fieldDefinitions];
                                            updated[index].name = e.target.value;
                                            setNewDefinition({
                                                ...newDefinition,
                                                fieldDefinitions: updated,
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="Key"
                                        value={field.key}
                                        onChange={(e) => {
                                            const updated = [...newDefinition.fieldDefinitions];
                                            updated[index].key = e.target.value;
                                            setNewDefinition({
                                                ...newDefinition,
                                                fieldDefinitions: updated,
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Field Type</InputLabel>
                                        <Select
                                            value={field.fieldType}
                                            label="Field Type"
                                            onChange={(e: SelectChangeEvent) => {
                                                const updated = [...newDefinition.fieldDefinitions];
                                                updated[index].fieldType = e.target.value;
                                                setNewDefinition((prev) => ({
                                                    ...prev,
                                                    fieldDefinitions: updated,
                                                }));
                                            }}
                                        >
                                            {fieldTypeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {newDefinition.fileType !== "YML" && (
                                    <>
                                        <Grid item xs={2}>
                                            <TextField
                                                fullWidth
                                                label="Start Position"
                                                type="number"
                                                value={field.startPosition}
                                                onChange={(e) => {
                                                    const updated = [...newDefinition.fieldDefinitions];
                                                    updated[index].startPosition = parseInt(
                                                        e.target.value || "0"
                                                    );
                                                    setNewDefinition({
                                                        ...newDefinition,
                                                        fieldDefinitions: updated,
                                                    });
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={2}>
                                            <TextField
                                                fullWidth
                                                label="End Position"
                                                type="number"
                                                value={field.endPosition}
                                                onChange={(e) => {
                                                    const updated = [...newDefinition.fieldDefinitions];
                                                    updated[index].endPosition = parseInt(
                                                        e.target.value || "0"
                                                    );
                                                    setNewDefinition({
                                                        ...newDefinition,
                                                        fieldDefinitions: updated,
                                                    });
                                                }}
                                            />
                                        </Grid>
                                    </>
                                )}

                                {newDefinition.fileType !== "FIXED_WIDTH_TOKENIZED" && (
                                    <Grid item xs={newDefinition.fileType === "YML" ? 4 : 2}>
                                        <TextField
                                            fullWidth
                                            label="Path"
                                            value={field.path}
                                            onChange={(e) => {
                                                const updated = [...newDefinition.fieldDefinitions];
                                                updated[index].path = e.target.value;
                                                setNewDefinition({
                                                    ...newDefinition,
                                                    fieldDefinitions: updated,
                                                });
                                            }}
                                        />
                                    </Grid>
                                )}

                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="Composite Key Order"
                                        type="number"
                                        value={field.compositeKeyOrder + 1}
                                        disabled
                                    />
                                </Grid>
                            </Grid>
                        ))}

                        <Button variant="contained" onClick={handleSave}>
                            Save
                        </Button>
                    </Box>
                )}

                <Box>
                    {fileDefinitions.length > 0 ? (
                        fileDefinitions.map((definition, index) => {
                            const rmcForThisDefinition = rmcGroupedByDefinitionId[definition.id] || [];

                            return (
                                <Paper
                                    key={definition.id || index}
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        backgroundColor: index % 2 === 0 ? "#d6d2d1" : "white",
                                        borderRadius: 0,
                                        mb: 2,
                                    }}
                                >
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            {editingDefinitionId === (definition.id || index) ? (
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
                                                    {definition.name || "File Name"}
                                                </Typography>
                                            )}

                                            {editingDefinitionId === (definition.id || index) ? (
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
                                                        {lineOfBusinessOptions.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <Typography variant="body2">
                                                    LOB: <b>{definition.lineOfBusiness}</b>
                                                </Typography>
                                            )}

                                            {editingDefinitionId === (definition.id || index) ? (
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
                                                        {fileTypeOptions.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <Typography variant="body2">
                                                    File Type: <b>{definition.fileType}</b>
                                                </Typography>
                                            )}

                                            <Typography variant="body2">
                                                Field Definitions:{" "}
                                                <b>{definition.fieldDefinitions?.length || 0}</b>
                                            </Typography>

                                            <Typography variant="body2">
                                                File Name Tokens:{" "}
                                                <b>{definition.fileNameTokens?.length || 0}</b>
                                            </Typography>

                                            <Box sx={{ mt: 2 }}>
                                                {editingDefinitionId === (definition.id || index) ? (
                                                    <>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            sx={{ mr: 1 }}
                                                            onClick={handleSaveEdit}
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
                                                        onClick={() => handleEditClick(definition, index)}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    onClick={() =>
                                                        handleToggleFieldDefinitions(definition.id || index)
                                                    }
                                                >
                                                    {expandedDefinitionId === (definition.id || index)
                                                        ? "Hide Field Definitions"
                                                        : "View Field Definitions"}
                                                </Button>
                                            </Box>

                                            {definition.id && (
                                                <RecordMatchCriteriaForm
                                                    fieldDefinitions={definition.fieldDefinitions || []}
                                                    onSubmit={async (data) => {
                                                        try {
                                                            await postRecordMatchCriteria(definition.id?.toString() || "", data);
                                                            alert("Record Match Criteria created successfully.");
                                                            if (definition.id) {
                                                                const updatedData = await getRecordMatchCriteria(clientId);
                                                                setRmcMap((prev) => ({
                                                                    ...prev,
                                                                    [definition.id]: updatedData,
                                                                }));
                                                            }
                                                        } catch (err) {
                                                            alert("Failed to create Record Match Criteria.");
                                                            console.error(err);
                                                        }
                                                    }}
                                                />
                                            )}

                                            {expandedDefinitionId === (definition.id || index) && (
                                                <Box sx={{ mt: 3, pl: 2 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight="bold"
                                                        sx={{ mb: 2 }}
                                                    >
                                                        Field Definitions
                                                    </Typography>
                                                    {definition.fieldDefinitions &&
                                                        definition.fieldDefinitions.length > 0 ? (
                                                        <ClientFileFieldDefinitions
                                                            fieldDefinitions={definition.fieldDefinitions}
                                                            fileDefinitionName={definition.name}
                                                            fileType={definition.fileType}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            No field definitions to display.
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}

                                            <RecordMatchCriteriaView
                                                rmcList={rmcMap[definition.id] || rmcForThisDefinition}
                                                loading={loadingRmcId === definition.id}
                                                onViewRMC={() => handleViewRMC(definition.id)}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            );
                        })
                    ) : (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <Typography variant="body1">
                                No file definitions found for this client.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Container>
    );
}

export default ClientFileDefinitions;
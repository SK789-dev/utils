import { useParams } from "react-router-dom";
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
    getFileTypes,
    getTokenTypes,
    getFieldTypes,
} from "@/api/clients/clientFileDefinitions";
import { getLinesOfBusiness } from "@/api/lineOfBusiness";
import { ClientFileDefinitions as ClientFileDefinitionsType } from "@/types/api";

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
    const { clientId } = useParams<{ clientId: string }>();
    const [clientName, setClientName] = useState<string>("");
    const [fileDefinitions, setFileDefinitions] = useState<ClientFileDefinitionsType[]>([]);
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState<boolean>(false);

    // State for dropdown options
    const [lineOfBusinessOptions, setLineOfBusinessOptions] = useState<DropdownOption[]>([]);
    const [fileTypeOptions, setFileTypeOptions] = useState<DropdownOption[]>([]);
    const [tokenTypeOptions, setTokenTypeOptions] = useState<DropdownOption[]>([]);
    const [fieldTypeOptions, setFieldTypeOptions] = useState<DropdownOption[]>([]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["clientFileDefinitions", clientId],
        queryFn: () => clientId ? getClientFileDefinitions(clientId) : Promise.resolve([]),
        enabled: !!clientId,
    });

    // Fetch dropdown options from API
    const { data: lobData } = useQuery({
        queryKey: ["linesOfBusiness"],
        queryFn: getLinesOfBusiness,
    });

    const { data: fileTypeData } = useQuery({
        queryKey: ["fileTypes"],
        queryFn: getFileTypes,
    });

    const { data: tokenTypeData } = useQuery({
        queryKey: ["tokenTypes"],
        queryFn: getTokenTypes,
    });

    const { data: fieldTypeData } = useQuery({
        queryKey: ["fieldTypes"],
        queryFn: getFieldTypes,
    });

    useEffect(() => {
        if (lobData) {
            setLineOfBusinessOptions(lobData);
        }
        if (fileTypeData) {
            setFileTypeOptions(fileTypeData);
        }
        if (tokenTypeData) {
            setTokenTypeOptions(tokenTypeData);
        }
        if (fieldTypeData) {
            setFieldTypeOptions(fieldTypeData);
        }
    }, [lobData, fileTypeData, tokenTypeData, fieldTypeData]);

    useEffect(() => {
        if (data) {
            setClientName(data.name ?? "");
            setFileDefinitions(Array.isArray(data) ? data : []);
        }
    }, [data]);

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
            return clientId ? postClientFileDefinitions(clientId, payload as ClientFileDefinitionsType) : Promise.resolve({});
        },
        onSuccess: () => {
            if (clientId) {
                queryClient.invalidateQueries(["clientFileDefinitions", clientId]);
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

    // Add a new token with automatic order number
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

    // Add a new field definition with automatic composite key order
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

    const handleLineOfBusinessChange = (event: SelectChangeEvent) => {
        setNewDefinition({
            ...newDefinition,
            lineOfBusiness: event.target.value,
        });
    };

    const handleFileTypeChange = (event: SelectChangeEvent) => {
        setNewDefinition({
            ...newDefinition,
            fileType: event.target.value,
        });
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
                    <Typography variant="h5">
                        {clientName || "Client"} - File Definitions
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => setShowAddForm((prev) => !prev)}
                    >
                        {showAddForm ? "Close" : "+ Add File Definition"}
                    </Button>
                </Box>

                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
                                    label="File Name *"
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
                                        label="Line of Business *"
                                        onChange={handleLineOfBusinessChange}
                                    >
                                        {lineOfBusinessOptions.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
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
                                        label="File Type *"
                                        onChange={handleFileTypeChange}
                                    >
                                        {fileTypeOptions.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Button
                            sx={{ mt: 3, mb: 2 }}
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
                                        value={field.tokenOrder}
                                        disabled={true} // Disabled as it's auto-generated
                                    />
                                </Grid>
                            </Grid>
                        ))}

                        <Button
                            sx={{ mt: 3, mb: 2 }}
                            variant="outlined"
                            onClick={handleAddFieldDefinition}
                        >
                            + Add Field Definition
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
                                                setNewDefinition({
                                                    ...newDefinition,
                                                    fieldDefinitions: updated,
                                                });
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
                                <Grid item xs={2}>
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
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="Composite Key Order"
                                        type="number"
                                        value={field.compositeKeyOrder}
                                        disabled={true} // Disabled as it's auto-generated
                                    />
                                </Grid>
                            </Grid>
                        ))}

                        <Button
                            variant="contained"
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </Box>
                )}

                <Box>
                    {fileDefinitions.length > 0 ? (
                        fileDefinitions.map((definition, index) => (
                            <Paper
                                key={definition.id || index}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: index % 2 === 0 ? "white.100" : "grey.100",
                                    borderRadius: 0,
                                }}
                            >
                                <Grid container spacing={2}>
                                    <Grid item xs={11}>
                                        <Typography variant="h6">
                                            {definition.name || "Name"}
                                        </Typography>
                                        <Typography variant="body2">
                                            LOB: {definition.lineOfBusiness || "Line of Business"}
                                        </Typography>
                                        <Typography variant="body2">
                                            File type: {definition.fileType || "File Type"}
                                        </Typography>
                                        <Typography variant="body2">
                                            {definition.fieldDefinitions?.length || 0} Field
                                            Definition(s)
                                        </Typography>
                                        <Typography variant="body2">
                                            {definition.fileNameTokens?.length || 0} File Name
                                            Token(s)
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))
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
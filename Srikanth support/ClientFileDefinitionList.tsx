import {
    getClientFileDefinitions,
    postClientFileDefinitions,
    createFieldDefinition,
    updateFieldDefinition,
    deleteFieldDefinition
} from "@/api/clientFileDefinitions";
import { getFieldTypes, getFileTypes, getTokenTypes } from "@/api/enums";
import { getLinesOfBusiness } from "@/api/linesOfBusiness";
import ClientFileDefinitionGridItem from "@/components/ClientFileDefinitionGridItem";
import { ClientFileDefinition } from "@/types/api";
import { FieldDefinitionEditor, FieldDefinitionDisplay } from "./reusable/FieldDefinitionComponents";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

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
    baseRecordFieldPaths: string[];
}

function ClientFileDefinitionList() {
    const { clientId } = useParams<{ clientId: string }>();
    const location = useLocation();
    const { clientName, clientCode } = location.state || {};
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [lineOfBusinessOptions, setLineOfBusinessOptions] = useState<
        DropdownOption[]
    >([]);
    const [fileTypeOptions, setFileTypeOptions] = useState<DropdownOption[]>([]);
    const [tokenTypeOptions, setTokenTypeOptions] = useState<DropdownOption[]>(
        []
    );
    const [fieldTypeOptions, setFieldTypeOptions] = useState<DropdownOption[]>(
        []
    );
    const [editingFieldIndex, setEditingFieldIndex] = useState(null);

    const {
        data: fileDefinitions,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["clientFileDefinitions", clientId],
        queryFn: () =>
            clientId
                ? getClientFileDefinitions(clientId)
                : Promise.resolve([] as ClientFileDefinition[]),
        enabled: !!clientId,
    });

    useEffect(() => {
        async function fetchDropdownOptions() {
            try {
                const [lobs, fileTypes, tokenTypes, fieldTypes] = await Promise.all([
                    getLinesOfBusiness(),
                    getFileTypes(),
                    getTokenTypes(),
                    getFieldTypes(),
                ]);
                setLineOfBusinessOptions(
                    lobs.map((line) => ({ value: line, label: line }))
                );
                setFileTypeOptions(
                    fileTypes.map((type: string) => ({ value: type, label: type }))
                );
                setTokenTypeOptions(
                    tokenTypes.map((type: string) => ({ value: type, label: type }))
                );
                setFieldTypeOptions(
                    fieldTypes.map((type: string) => ({ value: type, label: type }))
                );
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
        baseRecordFieldPaths: [],
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
                ...(newDefinition.baseRecordFieldPaths.length > 0 && {
                    baseRecordFieldPaths: newDefinition.baseRecordFieldPaths,
                }),
            };
            return clientId
                ? postClientFileDefinitions(clientId, payload as ClientFileDefinition)
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
                baseRecordFieldPaths: [],
            });
            setShowAddForm(false);
        },
    });

    const fieldDefinitionMutations = {
        create: useMutation({
            mutationFn: ({ definitionId, fieldDefinition }) =>
                createFieldDefinition(definitionId, fieldDefinition),
            onSuccess: () => {
                queryClient.invalidateQueries(['clientFileDefinitions', clientId]);
            },
        }),
        update: useMutation({
            mutationFn: ({ fieldDefinitionId, updates }) =>
                updateFieldDefinition(fieldDefinitionId, updates),
            onSuccess: () => {
                queryClient.invalidateQueries(['clientFileDefinitions', clientId]);
            },
        }),
        delete: useMutation({
            mutationFn: (fieldDefinitionId) =>
                deleteFieldDefinition(fieldDefinitionId),
            onSuccess: () => {
                queryClient.invalidateQueries(['clientFileDefinitions', clientId]);
            },
        }),
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
        setEditingFieldIndex(newDefinition.fieldDefinitions.length);
    };

    const handleSaveField = (field, index) => {
        const updated = [...newDefinition.fieldDefinitions];
        updated[index] = field;
        setNewDefinition({
            ...newDefinition,
            fieldDefinitions: updated,
        });
        setEditingFieldIndex(null);
    };

    const handleDeleteField = (index) => {
        if (window.confirm("Are you sure you want to delete this field definition?")) {
            const updated = newDefinition.fieldDefinitions.filter(
                (_, i) => i !== index
            );
            setNewDefinition({
                ...newDefinition,
                fieldDefinitions: updated,
            });
        }
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
            newDefinition.fieldDefinitions.length === 0 &&
            newDefinition.baseRecordFieldPaths.length === 0
        ) {
            const confirmSave = window.confirm(
                "No File Name Tokens or Field Definitions or Base Record Filed path added. Do you still want to save?"
            );
            if (!confirmSave) return;
        }
        mutation.mutate();
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ mb: 3, gap: 4 }}>
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
                                        onChange={(e) =>
                                            setNewDefinition({
                                                ...newDefinition,
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
                            </Grid>
                            <Grid item xs={4}>
                                <FormControl fullWidth>
                                    <InputLabel>File Type</InputLabel>
                                    <Select
                                        value={newDefinition.fileType}
                                        label="File Type"
                                        onChange={(e) =>
                                            setNewDefinition({
                                                ...newDefinition,
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
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Base Record Field Paths
                                </Typography>
                                {newDefinition.baseRecordFieldPaths.map((path, index) => (
                                    <Box key={index} display="flex" alignItems="center" mb={1}>
                                        <TextField
                                            fullWidth
                                            value={path}
                                            onChange={(e) => {
                                                const updated = [...newDefinition.baseRecordFieldPaths];
                                                updated[index] = e.target.value;
                                                setNewDefinition({
                                                    ...newDefinition,
                                                    baseRecordFieldPaths: updated,
                                                });
                                            }}
                                            label={`Base Path ${index + 1}`}
                                        />
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => {
                                                const updated =
                                                    newDefinition.baseRecordFieldPaths.filter(
                                                        (_, i) => i !== index
                                                    );
                                                setNewDefinition({
                                                    ...newDefinition,
                                                    baseRecordFieldPaths: updated,
                                                });
                                            }}
                                            sx={{ ml: 2 }}
                                        >
                                            Remove
                                        </Button>
                                    </Box>
                                ))}
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        setNewDefinition({
                                            ...newDefinition,
                                            baseRecordFieldPaths: [
                                                ...newDefinition.baseRecordFieldPaths,
                                                "",
                                            ],
                                        })
                                    }
                                >
                                    + Add Base Record Field Path
                                </Button>
                            </Grid>
                        </Grid>

                        {/* File Name Tokens Section */}
                        <Box sx={{ mt: 3, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                File Name Tokens
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleAddFileNameToken}
                            >
                                + Add File Name Token
                            </Button>
                        </Box>
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
                                <Grid item xs={2}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => {
                                            const updated = newDefinition.fileNameTokens.filter(
                                                (_, i) => i !== index
                                            );
                                            setNewDefinition({
                                                ...newDefinition,
                                                fileNameTokens: updated,
                                            });
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </Grid>
                            </Grid>
                        ))}

                        {/* Field Definitions Section */}
                        <Box sx={{ mt: 3, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Field Definitions
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleAddFieldDefinition}
                            >
                                + Add Field Definition
                            </Button>
                        </Box>

                        {newDefinition.fieldDefinitions?.map((field, index) => (
                            <Box key={`field-${index}`} sx={{ mb: 2 }}>
                                {editingFieldIndex === index ? (
                                    <FieldDefinitionEditor
                                        fieldDefinition={field}
                                        fieldTypes={fieldTypeOptions.map(opt => opt.value)}
                                        fileType={newDefinition.fileType}
                                        onSave={(updatedField) => handleSaveField(updatedField, index)}
                                        onCancel={() => setEditingFieldIndex(null)}
                                    />
                                ) : (
                                    <Paper elevation={0} sx={{ p: 2, backgroundColor: index % 2 === 0 ? "grey.100" : "white" }}>
                                        <FieldDefinitionDisplay
                                            definition={field}
                                            fileType={newDefinition.fileType}
                                            onEdit={() => setEditingFieldIndex(index)}
                                            onDelete={() => handleDeleteField(index)}
                                        />
                                    </Paper>
                                )}
                            </Box>
                        ))}

                        <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{ mt: 2 }}
                        >
                            Save
                        </Button>
                    </Box>
                )}
                <Box>
                    {isLoading ? (
                        <CircularProgress />
                    ) : isError ? (
                        <Snackbar open={true} autoHideDuration={6000}>
                            <Alert severity="error">Failed to load file definitions!</Alert>
                        </Snackbar>
                    ) : fileDefinitions?.length ? (
                        fileDefinitions.map((definition, index) => {
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
                                            <ClientFileDefinitionGridItem
                                                fileDefinition={definition}
                                                onFileDefinitionUpdated={() => {
                                                    refetch();
                                                }}
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

export default ClientFileDefinitionList;
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
} from "@mui/material";
import { useState, useEffect } from "react";
import {
    getClientFileDefinitions,
    postClientFileDefinitions,
} from "@/api/clients/clientFileDefinitions";
import { Stack } from "@mui/material";

function ClientFileDefinitions() {
    const { clientId } = useParams();
    const [clientName, setClientName] = useState("");
    const [fileDefinitions, setFileDefinitions] = useState([]);
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);

    const [errors, setErrors] = useState({
        name: false,
        lineOfBusiness: false,
        fileType: false,
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["clientFileDefinitions", clientId],
        queryFn: async () => {
            try {
                return await getClientFileDefinitions(clientId);
            } catch (error) {
                console.error("Error fetching client file definitions:", error);
                return [];
            }
        },
        enabled: !!clientId,
    });

    useEffect(() => {
        if (data) {
            setClientName(data[0].name);
            setFileDefinitions(data);
        }
    }, [data]);

    const [newDefinition, setNewDefinition] = useState({
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
            return postClientFileDefinitions(clientId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions", clientId]);
            setNewDefinition({
                name: "",
                lineOfBusiness: "",
                fileType: "",
                fileNameTokens: [],
                fieldDefinitions: [],
            });
            setShowAddForm(false);
            setErrors({ name: false, lineOfBusiness: false, fileType: false });
        },
    });

    const handleSave = () => {
        const currentErrors = {
            name: newDefinition.name.trim() === "",
            lineOfBusiness: newDefinition.lineOfBusiness.trim() === "",
            fileType: newDefinition.fileType.trim() === "",
        };

        setErrors(currentErrors);

        const hasError = Object.values(currentErrors).some(Boolean);
        if (hasError) return;

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

                {showAddForm && (
                    <Box sx={{ mt: 3, mb: 4, p: 2, border: "1px solid #ccc" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Add New File Definition
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="File Name"
                                    value={newDefinition.name}
                                    error={errors.name}
                                    helperText={errors.name && "File Name is required"}
                                    onChange={(e) =>
                                        setNewDefinition({ ...newDefinition, name: e.target.value })
                                    }
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="Line of Business"
                                    value={newDefinition.lineOfBusiness}
                                    error={errors.lineOfBusiness}
                                    helperText={errors.lineOfBusiness && "Line of Business is required"}
                                    onChange={(e) =>
                                        setNewDefinition({
                                            ...newDefinition,
                                            lineOfBusiness: e.target.value,
                                        })
                                    }
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="File Type"
                                    value={newDefinition.fileType}
                                    error={errors.fileType}
                                    helperText={errors.fileType && "File Type is required"}
                                    onChange={(e) =>
                                        setNewDefinition({
                                            ...newDefinition,
                                            fileType: e.target.value,
                                        })
                                    }
                                />
                            </Grid>
                        </Grid>

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setNewDefinition((prev) => ({
                                        ...prev,
                                        fileNameTokens: [
                                            ...(prev.fileNameTokens || []),
                                            { type: "", token: "", tokenOrder: 0 },
                                        ],
                                    }));
                                }}
                            >
                                + Add File Name Token
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => {
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
                                                compositeKeyOrder: 0,
                                                path: "",
                                            },
                                        ],
                                    }));
                                }}
                            >
                                + Add Field Definition
                            </Button>

                            <Button
                                sx={{ mt: 3 }}
                                variant="contained"
                                onClick={handleSave}
                            >
                                Save
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* File definitions list */}
            <Box>
                {fileDefinitions.length > 0 ? (
                    fileDefinitions.map((definition, index) => (
                        <Paper
                            key={definition.id || index}
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: index % 2 === 0 ? "white.100" : "grey.50",
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
                                        {definition.fieldDefinitions?.length || 0} Field Definition(s)
                                    </Typography>
                                    <Typography variant="body2">
                                        {definition.fileNameTokens?.length || 0} File Name Token(s)
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
        </Container>
    );
}

export default ClientFileDefinitions;

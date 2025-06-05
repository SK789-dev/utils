import { fetchFileDefinitionsByClientId, associateFileDefinition } from '@/api/clientFileDefinitions';
import { ClientFileDefinition } from '@/types/api';
import {
    Box,
    Card,
    CardContent,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    Button,
    Snackbar,
    Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

function AssociatedFileDefinition() {
    const { clientId, clientFileDefinitionId } = useParams();
    const navigate = useNavigate();
    const [selectedFileDefinition, setSelectedFileDefinition] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });


    const { data: clientFileDefinitions = [], isLoading } = useQuery({
        queryKey: ['clientFileDefinitions', clientId],
        queryFn: async () => {
            if (!clientId) return [];
            return fetchFileDefinitionsByClientId(clientId);
        },
    });


    const availableFileDefinitions = clientFileDefinitions.filter(
        (fileDef: ClientFileDefinition) => fileDef.id !== clientFileDefinitionId
    );

    const currentFileDefinition = clientFileDefinitions.find(
        (fileDef: ClientFileDefinition) => fileDef.id === clientFileDefinitionId
    );

    const handleAssociate = async () => {
        if (!selectedFileDefinition || !clientId || !clientFileDefinitionId) return;

        setLoading(true);

        try {

             await associateFileDefinition( {
                clientFileDefinition1Id: clientFileDefinitionId,
                clientFileDefinition2Id: selectedFileDefinition
            });

                
            setToast({
                open: true,
                message: 'File definitions successfully associated',
                severity: 'success'
            });


            setTimeout(() => {
                navigate(`/clients/${clientId}/file-definitions`);
            }, 5000);
        } catch (error) {
            console.error('Error associating file definitions:', error);

            setToast({
                open: true,
                message: 'Failed to associate file definitions',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`/clients/${clientId}/file-definitions`);
    };

    const handleCloseToast = () => {
        setToast(prev => ({ ...prev, open: false }));
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Button onClick={handleCancel} variant="outlined" sx={{ mb: 2 }}>
                    Back to Client
                </Button>
                <Typography variant="h4" component="h1" gutterBottom>
                    Associate File Definition
                </Typography>
            </Box>

            {isLoading ? (
                <Typography>Loading file definitions...</Typography>
            ) : (
                <>
                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Current File Definition</Typography>
                            {currentFileDefinition ? (
                                <>
                                    <Typography variant="body1"><strong>Name:</strong> {currentFileDefinition.name}</Typography>
                                    <Typography variant="body1"><strong>Line of Business:</strong> {currentFileDefinition.lineOfBusiness}</Typography>
                                    <Typography variant="body1"><strong>File Type:</strong> {currentFileDefinition.fileType}</Typography>
                                    <Typography variant="body1"><strong>Associated File Definition ID:</strong> {currentFileDefinition.associatedClientFileDefinitionId}</Typography>
                                </>
                            ) : (
                                <Typography color="error">File definition not found</Typography>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Select File Definition to Associate</Typography>
                            {availableFileDefinitions.length > 0 ? (
                                <>
                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel id="file-definition-select-label">File Definition</InputLabel>
                                        <Select
                                            labelId="file-definition-select-label"
                                            value={selectedFileDefinition}
                                            label="File Definition"
                                            onChange={(e) => setSelectedFileDefinition(e.target.value)}
                                        >
                                            {availableFileDefinitions.map((fileDef: ClientFileDefinition) => (
                                                <MenuItem key={fileDef.id} value={fileDef.id}>
                                                    {fileDef.name} ({fileDef.fileType})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {selectedFileDefinition && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1">Selected File Definition Details:</Typography>
                                            {(() => {
                                                const selected = availableFileDefinitions.find(
                                                    (fd: ClientFileDefinition) => fd.id === selectedFileDefinition
                                                );
                                                return selected ? (
                                                    <>
                                                        <Typography variant="body2"><strong>Name:</strong> {selected.name}</Typography>
                                                        <Typography variant="body2"><strong>Line of Business:</strong> {selected.lineOfBusiness}</Typography>
                                                        <Typography variant="body2"><strong>File Type:</strong> {selected.fileType}</Typography>
                                                        <Typography variant="body2">
                                                            <strong>Field Definitions:</strong> {selected.fieldDefinitions?.length || 0}
                                                        </Typography>
                                                    </>
                                                ) : null;
                                            })()}
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleAssociate}
                                            disabled={!selectedFileDefinition || loading}
                                        >
                                            {loading ? 'Associating...' : 'Associate File Definitions'}
                                        </Button>
                                    </Box>
                                </>
                            ) : (
                                <Typography>No other file definitions available for association</Typography>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseToast}
                    severity={toast.severity}
                    sx={{ width: '100%' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default AssociatedFileDefinition;
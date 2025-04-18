import { getClient, updateClient } from "@/api/clients";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { Edit, Close, Delete as DeleteIcon } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Formik, Form, FieldArray, Field } from "formik";
import * as Yup from "yup";

interface ClientLOB {
  id?: string;
  clientId?: string;
  lineOfBusiness: string;
  carrierId: string;
}

interface Client {
  id: string;
  name: string;
  code: string;
  linesOfBusiness: ClientLOB[];
}

const FormikTextField = ({ select = false, children, ...props }) => {
  return (
    <Field name={props.name}>
      {({ field, meta }) => (
        <TextField
          {...field}
          {...props}
          select={select}
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched && meta.error}
          sx={{ mx: 1, my: 1 }}
        >
          {children}
        </TextField>
      )}
    </Field>
  );
};

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  code: Yup.string().required("Code is required"),
  linesOfBusiness: Yup.array().of(
    Yup.object({
      lineOfBusiness: Yup.string().required("Line of Business is required"),
      carrierId: Yup.string().required("Carrier ID is required"),
    })
  ),
});

function ClientView() {
  const { clientId } = useParams();
  const queryClient = useQueryClient();

  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => getClient(clientId as string),
    enabled: !!clientId,
  });

  // Fetch available lines of business
  const {
    data: linesOfBusiness = [],
    isLoading: isLoadingLOB,
  } = useQuery({
    queryKey: ["linesOfBusiness"],
    queryFn: async () => {
      const response = await fetch("/api/line-of-business");
      if (!response.ok) throw new Error("Failed to fetch lines of business");
      return response.json();
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientState, setClientState] = useState<Client | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    if (client) {
      setClientState(client);
    }
  }, [client]);

  const updateClientMutation = useMutation({
    mutationFn: ([id, payload]: [string, Client]) => {
      return updateClient(id, payload);
    },
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(["client", clientId], data);
      setClientState(data);
      setSnackbar({
        open: true,
        message: "Client updated successfully!",
        severity: "success",
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: "Failed to update client. Please try again.",
        severity: "error",
      });
    },
  });

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = (values: Client) => {
    if (!clientId) return;
    
    // Call the API to update the client
    updateClientMutation.mutate([
      clientId,
      values
    ]);

    setDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container sx={{ mt: 4 }}>
      {isLoading ? (
        <CircularProgress />
      ) : isError ? (
        <Snackbar open autoHideDuration={6000}>
          <Alert severity="error">Failed to fetch client details!</Alert>
        </Snackbar>
      ) : clientState ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Typography variant="h4" gutterBottom>
              {clientState.name} ({clientState.code})
            </Typography>
            <IconButton onClick={handleOpenDialog} color="primary">
              <Edit />
            </IconButton>
          </div>

          <Typography
            variant="h5"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            CarrierIds by LOB
          </Typography>

          <div className="flex flex-col w-full gap-2 pt-2">
            {Object.entries(
              clientState.linesOfBusiness.reduce<Record<string, string[]>>(
                (carrierIdsByLOB, clientLOB) => {
                  const { lineOfBusiness: lob, carrierId } = clientLOB;
                  if (!carrierIdsByLOB[lob]) {
                    carrierIdsByLOB[lob] = [];
                  }
                  carrierIdsByLOB[lob].push(carrierId);
                  return carrierIdsByLOB;
                },
                {}
              )
            ).map(([lob, carrierIds]) => (
              <div key={`lob-${lob}`} className="flex flex-row items-center">
                <Typography variant="body1">
                  <strong>{lob}:</strong>&nbsp;
                  {carrierIds.join(", ")}
                </Typography>
              </div>
            ))}
          </div>

          {/* Edit Client Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              Edit Client
              <IconButton
                aria-label="close"
                onClick={handleCloseDialog}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <Formik
              initialValues={clientState}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange }) => (
                <Form>
                  <DialogContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormikTextField
                          label="Client Name"
                          name="name"
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormikTextField
                          label="Client Code"
                          name="code"
                          fullWidth
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                          Lines of Business
                        </Typography>
                        
                        <FieldArray name="linesOfBusiness">
                          {({ push, remove }) => (
                            <>
                              {values.linesOfBusiness.map((_, index) => (
                                <Grid
                                  container
                                  item
                                  key={`line-of-business_${index}`}
                                  alignItems="center"
                                >
                                  <Grid item xs={12} md={5}>
                                    <FormikTextField
                                      select
                                      fullWidth
                                      label="Line of Business"
                                      name={`linesOfBusiness[${index}].lineOfBusiness`}
                                      onChange={handleChange}
                                      required
                                    >
                                      {isLoadingLOB ? (
                                        <MenuItem disabled>Loading...</MenuItem>
                                      ) : (
                                        linesOfBusiness?.map((lob) => (
                                          <MenuItem key={lob} value={lob} id={lob}>
                                            {lob}
                                          </MenuItem>
                                        ))
                                      )}
                                    </FormikTextField>
                                  </Grid>
                                  <Grid item xs={12} md={5}>
                                    <FormikTextField
                                      fullWidth
                                      label="Carrier ID"
                                      name={`linesOfBusiness[${index}].carrierId`}
                                      required
                                    />
                                  </Grid>
                                  <Grid
                                    item
                                    xs={12}
                                    md={2}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Button onClick={() => remove(index)}>
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </Button>
                                  </Grid>
                                </Grid>
                              ))}
                              <Grid item xs={12} sx={{ mt: 2 }}>
                                <Button
                                  variant="outlined"
                                  onClick={() => {
                                    push({
                                      lineOfBusiness: "",
                                      carrierId: "",
                                    });
                                  }}
                                >
                                  Add LOB & Carrier ID
                                </Button>
                              </Grid>
                            </>
                          )}
                        </FieldArray>
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={updateClientMutation.isPending}
                    >
                      {updateClientMutation.isPending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </DialogActions>
                </Form>
              )}
            </Formik>
          </Dialog>
        </>
      ) : null}

      {/* Success/Error Notification */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ClientView;
import React from "react";
import { createClient } from "@/api/clients";
import { CreateClientRequest } from "@/api/clients/ClientRequests";
import { getLinesOfBusiness } from "@/api/lineOfBusiness";
import GenericDialog from "@/components/pop-up/GenericDialog";
import FormikTextField from "@/form/formik/FormikTextField";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, Grid, MenuItem, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { FieldArray, Formik } from "formik";
import { useEffect, useState } from "react";
import { ApiError } from "../../types/api";

const CREATE_CLIENT_FORM = "create-client-form";

interface CreateClientModalProps {
    onClose: () => void;
    onClientCreated: (clientName: string) => void;
}

export default function CreateClientModal({
    onClose,
    onClientCreated,
}: CreateClientModalProps) {
    const [createClientErrors, setCreateClientErrors] = useState<
        string[] | undefined
    >(undefined);

    const { data: linesOfBusiness } = useQuery({
        queryKey: ["lobs"],
        queryFn: async () => getLinesOfBusiness(),
    });

    useEffect(() => { }, [linesOfBusiness]);

    return (
        <GenericDialog
            title="Create Client"
            formId={CREATE_CLIENT_FORM}
            handleClose={onClose}
            closeButtonLabel="Cancel"
            submitButtonLabel="Create Client"
        >
            <Grid container direction="column">
                <Grid item>
                    <Formik
                        initialValues={
                            { name: "", code: "", linesOfBusiness: [] } as CreateClientRequest
                        }
                        onSubmit={(values) => {
                            setCreateClientErrors(undefined);
                            createClient({
                                name: values.name,
                                code: values.code,
                                linesOfBusiness: values.linesOfBusiness,
                            })
                                .then((data) => onClientCreated(data.name))
                                .catch((err: AxiosError) => {
                                    const errorDetails = err.response?.data as ApiError;
                                    setCreateClientErrors(errorDetails.message.split("|"));
                                });
                        }}
                    >
                        {({ values, handleChange, handleSubmit }) => (
                            <form id={CREATE_CLIENT_FORM} onSubmit={handleSubmit}>
                                <Grid container spacing={2}>
                                    {createClientErrors && (
                                        <Grid item xs={12}>
                                            <div className="flex flex-col items-start text-red-500 w-full pl-6">
                                                <Typography variant="h6">
                                                    Client NOT CREATED as {createClientErrors.length} error
                                                    {createClientErrors.length > 1 && "s"}{" "}
                                                    {createClientErrors.length > 1 ? "were" : "was"}{" "}
                                                    encountered...
                                                </Typography>
                                                <ul className="text-black text-sm pl-6">
                                                    {createClientErrors.map((error, index) => (
                                                        <li className="list-disc" key={`error-${index}`}>
                                                            <strong>{error}</strong>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </Grid>
                                    )}

                                    <Grid item xs={6}>
                                        <FormikTextField label="Client Name" name="name" />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormikTextField label="Client Code" name="code" />
                                    </Grid>

                                    <FieldArray name="linesOfBusiness">
                                        {({ push, remove }) => (
                                            <>
                                                {values.linesOfBusiness.map((_, index) => (
                                                    <Grid
                                                        container
                                                        item
                                                        spacing={2}
                                                        key={`line-of-business_${index}`}
                                                    >
                                                        <Grid item xs={4}>
                                                            <FormikTextField
                                                                style={{ width: "100%" }}
                                                                onChange={handleChange}
                                                                select
                                                                label="Line of Business"
                                                                name={`linesOfBusiness[${index}].lineOfBusiness`}
                                                                required
                                                            >
                                                                {linesOfBusiness?.length === 0 ? (
                                                                    <MenuItem disabled>Loading...</MenuItem>
                                                                ) : (
                                                                    linesOfBusiness?.map((lob) => (
                                                                        <MenuItem key={lob} value={lob}>
                                                                            {lob}
                                                                        </MenuItem>
                                                                    ))
                                                                )}
                                                            </FormikTextField>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <FormikTextField
                                                                label="Carrier Id"
                                                                name={`linesOfBusiness[${index}].carrierId`}
                                                                required
                                                            />
                                                        </Grid>
                                                        <Grid item xs={4} display="flex" alignItems="center">
                                                            <Button onClick={() => remove(index)}>
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                ))}
                                                <Grid item xs={12}>
                                                    <Button
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
                            </form>
                        )}
                    </Formik>
                </Grid>
            </Grid>
        </GenericDialog>
    );
}

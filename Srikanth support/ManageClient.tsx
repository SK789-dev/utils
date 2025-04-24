import React, { useEffect, useState } from "react";
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
import { ApiError } from "../../types/api";

const CREATE_CLIENT_FORM = "create-client-form";

interface ManageClientModalProps {
    onClose: () => void;
    onClientCreated: (clientData: any) => void;
    title?: string;
    submitButtonLabel?: string;
    initialValues?: any;
}

export default function ManageClientModal({
    onClose,
    onClientCreated,
    title = "Create Client",
    submitButtonLabel = "Create Client",
    initialValues,
}: ManageClientModalProps) {
    const [createClientErrors, setCreateClientErrors] = useState<string[] | undefined>(undefined);

    const { data: linesOfBusiness } = useQuery({
        queryKey: ["lobs"],
        queryFn: async () => getLinesOfBusiness(),
    });

    const defaultValues = {
        name: "",
        code: "",
        linesOfBusiness: []
    };

    useEffect(() => { }, [linesOfBusiness]);

    return (
        <GenericDialog
            title={title}
            formId={CREATE_CLIENT_FORM}
            handleClose={onClose}
            closeButtonLabel="Cancel"
            submitButtonLabel={submitButtonLabel}
        >
            <Grid container direction="column">
                <Grid item>
                    <Formik
                        initialValues={initialValues || defaultValues}
                        onSubmit={(values) => {
                            setCreateClientErrors(undefined);
                            // For creating new clients
                            if (!initialValues) {
                                createClient({
                                    name: values.name,
                                    code: values.code,
                                    linesOfBusiness: values.linesOfBusiness,
                                })
                                    .then((data) => {
                                        onClientCreated(data.name);
                                    })
                                    .catch((err: AxiosError) => {
                                        const errorDetails = err.response?.data as ApiError;
                                        setCreateClientErrors(errorDetails.message.split("|"));
                                    });
                            } else {
                                // For updating existing clients
                                onClientCreated(values);
                            }
                        }}
                    >
                        {({ values, handleChange, handleSubmit }) => (
                            <form id={CREATE_CLIENT_FORM} onSubmit={handleSubmit}>
                                <Grid container>
                                    {createClientErrors && (
                                        <div className="flex flex-col items-start text-red-500 w-full pl-6">
                                            <Typography variant="h6">
                                                Client NOT {initialValues ? "UPDATED" : "CREATED"} as {createClientErrors.length} error
                                                {createClientErrors.length > 1 && "s"} {createClientErrors.length > 1 ? "were" : "was"} encountered...
                                            </Typography>
                                            <ul className="text-black text-sm pl-6">
                                                {createClientErrors.map((error, index) => (
                                                    <li className="list-disc" key={`error-${index}`}>
                                                        <strong>{error}</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <Grid item xs={6}>
                                        <FormikTextField label="Client Name" name="name" />
                                    </Grid>
                                    <Grid item>
                                        <FormikTextField label="Client Code" name="code" />
                                    </Grid>
                                    <FieldArray name="linesOfBusiness">
                                        {({ push, remove }) => (
                                            <>
                                                {values.linesOfBusiness.map((_, index) => (
                                                    <Grid container item key={`line-of-business_${index}`}>
                                                        <Grid item>
                                                            <FormikTextField
                                                                style={{ width: 200 }}
                                                                onChange={handleChange}
                                                                select
                                                                label="Line of Business"
                                                                name={`linesOfBusiness[${index}].lineOfBusiness`}
                                                                defaultValue={"COMMERCIAL"}
                                                                required
                                                            >
                                                                {linesOfBusiness?.length === 0 ? (
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
                                                        <Grid item>
                                                            <FormikTextField
                                                                label="Carrier Id"
                                                                name={`linesOfBusiness[${index}].carrierId`}
                                                                required
                                                            />
                                                        </Grid>
                                                        <Grid item display="flex" alignItems="center" justifyContent="center">
                                                            <Button onClick={() => remove(index)}>
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                ))}
                                                <Grid item xs={12}>
                                                    <Button
                                                        onClick={() => {
                                                            push({ lineOfBusiness: "", carrierId: "" });
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
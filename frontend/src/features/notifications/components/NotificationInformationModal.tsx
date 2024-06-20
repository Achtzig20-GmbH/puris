/*
Copyright (c) 2024 Volkswagen AG
Copyright (c) 2024 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This program and the accompanying materials are made available under the
terms of the Apache License, Version 2.0 which is available at
https://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.

SPDX-License-Identifier: Apache-2.0
*/
import { Input, PageSnackbar, PageSnackbarStack, Textarea } from '@catena-x/portal-shared-components';
import { DateTime } from '@components/ui/DateTime';
import { Close, Send } from '@mui/icons-material';
import { Autocomplete, Box, Button, Dialog, DialogTitle, FormLabel, Grid, InputLabel, Stack, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { LabelledAutoComplete } from '@components/ui/LabelledAutoComplete';
import { postDemandAndCapacityNotification, putDemandAndCapacityNotification } from '@services/demand-capacity-notification';
import { Notification } from '@models/types/data/notification';
import { EFFECTS } from '@models/constants/effects';
import { useAllPartners } from '@hooks/useAllPartners';
import { LEADING_ROOT_CAUSE } from '@models/constants/leading-root-causes';
import { STATUS } from '@models/constants/status';
import { DemandCapacityNotification } from '@models/types/data/demand-capacity-notification';
import { Site } from '@models/types/edc/site';
import { useSites } from '@features/stock-view/hooks/useSites';
import { usePartnerMaterials } from '@hooks/usePartnerMaterials';
import { ModalMode } from '@models/types/data/modal-mode';

const isValidDemandCapacityNotification = (notification: Partial<DemandCapacityNotification>) =>
    notification.partnerBpnl &&
    notification.effect &&
    notification.status &&
    notification.startDateOfEffect &&
    (!notification.expectedEndDateOfEffect || notification.startDateOfEffect < notification.expectedEndDateOfEffect);

type DemandCapacityNotificationInformationModalProps = {
    open: boolean;
    mode: ModalMode
    demandCapacityNotification: DemandCapacityNotification | null;
    onClose: () => void;
    onSave: () => void;
};

export const DemandCapacityNotificationInformationModal = ({
    open,
    mode,
    demandCapacityNotification,
    onClose,
    onSave,
}: DemandCapacityNotificationInformationModalProps) => {
    const [temporaryDemandCapacityNotification, setTemporaryDemandCapacityNotification] = useState<Partial<DemandCapacityNotification>>(demandCapacityNotification ?? {});
    const { partners } = useAllPartners();
    const [availablePartners, setAvailablePartners] = useState(partners);
    const { partnerMaterials } = usePartnerMaterials(temporaryDemandCapacityNotification.partnerBpnl);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [formError, setFormError] = useState(false);
    const { sites } = useSites();
    
    useEffect(() => {
        if (mode === 'react') {
            setTemporaryDemandCapacityNotification({
                ...demandCapacityNotification,
                partnerBpnl: undefined,
                affectedMaterialNumbers: [],
                affectedSitesBpnsRecipient: [],
                affectedSitesBpnsSender: [],
            });
        }
        else {
            setTemporaryDemandCapacityNotification(demandCapacityNotification ?? {});
        }
        if (partners !== null) {
            const newFilteredPartners = partners.filter((partner) => partner.bpnl !== demandCapacityNotification?.partnerBpnl);
            setAvailablePartners(newFilteredPartners);
        }
    }, [demandCapacityNotification, mode, partners]);

    useEffect(() => {
        if (temporaryDemandCapacityNotification.partnerBpnl) {
            setTemporaryDemandCapacityNotification((prevState) => ({
                ...prevState,
                affectedMaterialNumbers: [],
                affectedSitesBpnsRecipient: [],
            }));
        }
    }, [temporaryDemandCapacityNotification.partnerBpnl]);

    const handleSaveClick = () => {
        if (!isValidDemandCapacityNotification(temporaryDemandCapacityNotification)) {
            setFormError(true);
            return;
        }
        setFormError(false);
        if (mode === 'edit') {
            putDemandAndCapacityNotification(temporaryDemandCapacityNotification)
                .then(handleResponse)
                .catch((error) => handleError(error))
                .finally(handleClose);
        } else if (mode === 'create') {
            postDemandAndCapacityNotification(temporaryDemandCapacityNotification)
                .then(handleResponse)
                .catch((error) => handleError(error))
                .finally(handleClose);
        } else if (mode === 'react') {
            postDemandAndCapacityNotification({
                ...temporaryDemandCapacityNotification,
                relatedNotificationId: demandCapacityNotification?.notificationId,
                notificationId: undefined,
            }).then(handleResponse)
                .catch((error) => handleError(error))
                .finally(handleClose);
        }
    };

    const handleError = (error: { status: number; error: string; }) => {
        setNotifications((ns) => [
            ...ns,
            {
                title: error.status === 409 ? 'Conflict' : 'Error requesting update',
                description: error.status === 409 ? 'Demand Capacity Notification conflicting with an existing one' : error.error,
                severity: 'error',
            },
        ]);
    };

    const handleResponse = () => {
        onSave();
        setNotifications((ns) => [
            ...ns,
            {
                title: 'Notification Saved',
                description: 'Notification has been saved',
                severity: 'success',
            },
        ]);
    };

    const handleClose = () => {
        setFormError(false);
        setTemporaryDemandCapacityNotification({});
        onClose();
    };

    const DemandCapacityNotificationView = () => {
        if (!demandCapacityNotification) {
            return <div>No demand capacity notification available</div>;
        }
        return (
            <Grid container spacing={3} padding=".25rem">
                <Grid display="grid" item xs={6}>
                    <FormLabel>Partner</FormLabel>
                    {partners?.find((p) => p.bpnl === demandCapacityNotification.partnerBpnl)?.name}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Leading Root Cause</FormLabel>
                    {LEADING_ROOT_CAUSE.find((dt) => dt.key === demandCapacityNotification.leadingRootCause)?.value}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Status</FormLabel>
                    {STATUS.find((dt) => dt.key === demandCapacityNotification.status)?.value}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Effect</FormLabel>
                    {EFFECTS.find((dt) => dt.key === demandCapacityNotification.effect)?.value}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Start Date of Effect</FormLabel>
                    {new Date(demandCapacityNotification.startDateOfEffect).toLocaleString()}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Expected End Date of Effect</FormLabel>
                    {new Date(demandCapacityNotification.expectedEndDateOfEffect).toLocaleString()}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Affected Sites Sender</FormLabel>
                    {demandCapacityNotification.affectedSitesBpnsSender && demandCapacityNotification.affectedSitesBpnsSender.length > 0
                        ? demandCapacityNotification.affectedSitesBpnsSender.join(', ')
                        : 'None'}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Affected Sites Recipient</FormLabel>
                    {demandCapacityNotification.affectedSitesBpnsRecipient && demandCapacityNotification.affectedSitesBpnsRecipient.length > 0
                        ? demandCapacityNotification.affectedSitesBpnsRecipient.join(', ')
                        : 'None'}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Affected Material Numbers</FormLabel>
                    {demandCapacityNotification.affectedMaterialNumbers && demandCapacityNotification.affectedMaterialNumbers.length > 0
                        ? demandCapacityNotification.affectedMaterialNumbers.join(', ')
                        : 'None'}
                </Grid>
                <Grid display="grid" item xs={6}>
                    <FormLabel>Content Changed</FormLabel>
                    {new Date(demandCapacityNotification.contentChangedAt).toLocaleString()}
                </Grid>
                <Grid display="grid" item xs={12}>
                    <FormLabel>Text</FormLabel>
                    {demandCapacityNotification.text ?? 'None'}
                </Grid>
            </Grid>
        );
    };

    const RelatedNotification = () => {
        return (
            <>
                <InputLabel>Related Notification</InputLabel>
                <Tooltip
                    placement="right-end"
                    componentsProps={{
                        tooltip: {
                            sx: {
                                bgcolor: 'white',
                                color: 'black',
                                fontSize: 12,
                                boxShadow: 5,
                            },
                        },
                    }}
                    title={<DemandCapacityNotificationView></DemandCapacityNotificationView>}
                >
                    <Button >
                        {temporaryDemandCapacityNotification.notificationId}
                    </Button>
                </Tooltip>
            </>
        )
    }


    return (
        <>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle fontWeight={600} textAlign="center">
                    Demand Capacity Notification Information
                </DialogTitle>
                <Stack padding="0 2rem 2rem" sx={{ width: '60rem' }}>
                    {mode !== 'view' ? (
                        <Grid container spacing={1} padding=".25rem">
                            <>
                                {mode === 'react' &&
                                    <Grid item xs={12}>
                                        <RelatedNotification></RelatedNotification>
                                    </Grid>
                                }
                                <Grid item xs={6}>
                                    <LabelledAutoComplete
                                        sx={{ margin: '0' }}
                                        id="partner"
                                        options={availablePartners ?? []}
                                        getOptionLabel={(option) => option?.name ?? ''}
                                        label="Partner*"
                                        placeholder="Select a Partner"
                                        error={formError && !temporaryDemandCapacityNotification?.partnerBpnl}
                                        onChange={(_, value) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                partnerBpnl: value?.bpnl ?? undefined,
                                            })
                                        }
                                        value={availablePartners?.find((p) => p.bpnl === temporaryDemandCapacityNotification.partnerBpnl) ?? null}
                                        isOptionEqualToValue={(option, value) => option?.bpnl === value?.bpnl}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <LabelledAutoComplete
                                        id="leadingRootCause"
                                        options={LEADING_ROOT_CAUSE}
                                        getOptionLabel={(option) => option.value ?? ''}
                                        isOptionEqualToValue={(option, value) => option?.key === value.key}
                                        onChange={(_, value) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                leadingRootCause: value?.key ?? undefined,
                                            })
                                        }
                                        value={
                                            LEADING_ROOT_CAUSE.find(
                                                (dt) => dt.key === temporaryDemandCapacityNotification.leadingRootCause
                                            ) ?? null
                                        }
                                        label="Leading cause*"
                                        placeholder="Select the leading cause"
                                        error={formError && !temporaryDemandCapacityNotification?.leadingRootCause}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <LabelledAutoComplete
                                        id="status"
                                        options={STATUS}
                                        getOptionLabel={(option) => option.value ?? ''}
                                        isOptionEqualToValue={(option, value) => option?.key === value.key}
                                        onChange={(_, value) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                status: value?.key ?? undefined,
                                            })
                                        }
                                        value={STATUS.find((dt) => dt.key === temporaryDemandCapacityNotification.status) ?? null}
                                        label="Status*"
                                        placeholder="Select the status"
                                        error={formError && !temporaryDemandCapacityNotification?.status}
                                    ></LabelledAutoComplete>
                                </Grid>
                                <Grid item xs={6}>
                                    <LabelledAutoComplete
                                        id="effect"
                                        options={EFFECTS}
                                        getOptionLabel={(option) => option.value ?? ''}
                                        isOptionEqualToValue={(option, value) => option?.key === value.key}
                                        onChange={(_, value) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                effect: value?.key ?? undefined,
                                            })
                                        }
                                        value={EFFECTS.find((dt) => dt.key === temporaryDemandCapacityNotification.effect) ?? null}
                                        label="Effect*"
                                        placeholder="Select the effect"
                                        error={formError && !temporaryDemandCapacityNotification?.effect}
                                    />
                                </Grid>
                                <Grid item xs={6} display="flex" alignItems="end">
                                    <DateTime
                                        label="Start Date of Effect*"
                                        placeholder="Pick Effect start date"
                                        locale="de"
                                        error={
                                            formError &&
                                            (!temporaryDemandCapacityNotification.startDateOfEffect ||
                                                temporaryDemandCapacityNotification.startDateOfEffect > new Date() ||
                                                (!!temporaryDemandCapacityNotification.expectedEndDateOfEffect &&
                                                    temporaryDemandCapacityNotification.startDateOfEffect >
                                                    temporaryDemandCapacityNotification.expectedEndDateOfEffect))
                                        }
                                        value={temporaryDemandCapacityNotification?.startDateOfEffect ?? null}
                                        onValueChange={(date) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                startDateOfEffect: date ?? undefined,
                                            })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6} display="flex" alignItems="end">
                                    <DateTime
                                        label="Expected End Date Of Effect"
                                        placeholder="Pick Expected End Date Of Effect"
                                        locale="de"
                                        error={
                                            formError &&
                                            (!temporaryDemandCapacityNotification?.expectedEndDateOfEffect ||
                                                temporaryDemandCapacityNotification?.expectedEndDateOfEffect < new Date() ||
                                                (!!temporaryDemandCapacityNotification.startDateOfEffect &&
                                                    temporaryDemandCapacityNotification?.expectedEndDateOfEffect <
                                                    temporaryDemandCapacityNotification.startDateOfEffect))
                                        }
                                        value={temporaryDemandCapacityNotification?.expectedEndDateOfEffect ?? null}
                                        onValueChange={(date) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                expectedEndDateOfEffect: date ?? undefined,
                                            })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <InputLabel>Affected Sites Sender</InputLabel>
                                    <Autocomplete
                                        id="own-sites"
                                        value={temporaryDemandCapacityNotification.affectedSitesBpnsSender ?? []}
                                        options={sites?.map((site) => site.bpns) ?? []}
                                        getOptionLabel={(option) => `${sites?.find((site) => site.bpns === option)?.name} (${option})`}
                                        isOptionEqualToValue={(option, value) => option === value}
                                        renderInput={(params) => (
                                            <Input {...params} hiddenLabel placeholder={`Select Sender Affected Sites`} />
                                        )}
                                        onChange={(_, value) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                affectedSitesBpnsSender: value ?? [],
                                            })
                                        }
                                        multiple={true}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <InputLabel>Affected Material Numbers</InputLabel>
                                    <Autocomplete
                                        id="affected-material-numbers"
                                        value={temporaryDemandCapacityNotification.affectedMaterialNumbers ?? []}
                                        options={partnerMaterials?.map((partnerMaterial) => partnerMaterial.ownMaterialNumber) ?? []}
                                        getOptionLabel={(option) =>
                                            `${partnerMaterials?.find((material) => material.ownMaterialNumber === option)?.name
                                            } (${option})`
                                        }
                                        isOptionEqualToValue={(option, value) => option === value}
                                        renderInput={(params) => (
                                            <Input {...params} hiddenLabel placeholder={`Select Affected Material Numbers`} />
                                        )}
                                        onChange={(_, value) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                affectedMaterialNumbers: value ?? [],
                                            })
                                        }
                                        disabled={!temporaryDemandCapacityNotification?.partnerBpnl}
                                        multiple={true}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <InputLabel>Affected Sites Recipient</InputLabel>
                                    <Autocomplete
                                        id="partner-site"
                                        value={temporaryDemandCapacityNotification.affectedSitesBpnsRecipient ?? []}
                                        options={
                                            availablePartners
                                                ?.find((partner) => partner.bpnl === temporaryDemandCapacityNotification?.partnerBpnl)
                                                ?.sites.map((site) => site.bpns) ?? []
                                        }
                                        disabled={!temporaryDemandCapacityNotification?.partnerBpnl}
                                        getOptionLabel={(option) =>
                                            `${availablePartners
                                                ?.reduce((acc: Site[], p) => [...acc, ...p.sites], [])
                                                .find((site) => site.bpns === option)?.name
                                            } (${option})`
                                        }
                                        isOptionEqualToValue={(option, value) => option === value}
                                        renderInput={(params) => (
                                            <Input {...params} hiddenLabel placeholder={`Select Affected Sites of Partner`} />
                                        )}
                                        onChange={(_, value) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                affectedSitesBpnsRecipient: value ?? [],
                                            })
                                        }
                                        multiple={true}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormLabel>Text</FormLabel>
                                    <Textarea
                                        minRows="5"
                                        id="text"
                                        value={temporaryDemandCapacityNotification?.text ?? ''}
                                        onChange={(event) =>
                                            setTemporaryDemandCapacityNotification({
                                                ...temporaryDemandCapacityNotification,
                                                text: event.target.value,
                                            })
                                        }
                                        error={formError && !temporaryDemandCapacityNotification?.text}
                                    />
                                </Grid>
                            </>
                        </Grid>
                    ) : (demandCapacityNotification &&
                        <DemandCapacityNotificationView
                        ></DemandCapacityNotificationView>
                    )}
                    <Box display="flex" gap="1rem" width="100%" justifyContent="end" marginTop="1rem">
                        <Button variant="outlined" color="primary" sx={{ display: 'flex', gap: '.25rem' }} onClick={handleClose}>
                            <Close></Close> Close
                        </Button>
                        {mode !== 'view' ? (
                            <Button
                                variant="contained"
                                color="primary"
                                sx={{ display: 'flex', gap: '.25rem' }}
                                onClick={() => handleSaveClick()}
                            >
                                <Send></Send> {mode === 'create' ? 'Send' : mode === 'react' ? 'React' : 'Update'} </Button>
                        ) : null}
                    </Box>
                </Stack>
            </Dialog >
            <PageSnackbarStack>
                ?
                {notifications.map((notification, index) => (
                    <PageSnackbar
                        key={index}
                        open={!!notification}
                        severity={notification?.severity}
                        title={notification?.title}
                        description={notification?.description}
                        autoClose={true}
                        onCloseNotification={() => setNotifications((ns) => ns.filter((_, i) => i !== index) ?? [])}
                    />
                ))}
            </PageSnackbarStack>
        </>
    );
};

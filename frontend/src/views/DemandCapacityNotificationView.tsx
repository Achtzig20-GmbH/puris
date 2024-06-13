/*
Copyright (c) 2023,2024 Volkswagen AG
Copyright (c) 2023,2024 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V. (represented by Fraunhofer ISST)
Copyright (c) 2023,2024 Contributors to the Eclipse Foundation

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

import { Tab, TabPanel, Tabs, Table } from '@catena-x/portal-shared-components';
import { Box, Button, Stack, Typography } from '@mui/material';
import { getDemandAndCapacityNotification } from '@services/demand-capacity-notification';
import { useEffect, useState } from 'react';
import { Add } from '@mui/icons-material';
import { DemandCapacityNotificationInformationModal } from '@features/notifications/components/NotificationInformationModal';
import { DemandCapacityNotification } from '@models/types/data/demand-capacity-notification';
import { EFFECTS } from '@models/constants/effects';
import { LEADING_ROOT_CAUSE } from '@models/constants/leading-root-causes';
import { STATUS } from '@models/constants/status';


export const DemandCapacityNotificationView = () => {

    const [selectedTab, setSelectedTab] = useState<number>(0);
    const [demandCapacityNotification, setDemandCapacityNotification] = useState<DemandCapacityNotification[]>([]);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedNotification, setSelectedNotification] = useState<DemandCapacityNotification | null>(null);

    const tabs = ['Incoming', 'Outgoing'];

    const fetchAndLogNotification = async () => {
        try {
            const result = await getDemandAndCapacityNotification(selectedTab === 0);
            setDemandCapacityNotification(result);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchAndLogNotification();
    }, [selectedTab]);

    const TabPanelContent = ({ notifications }: { notifications: DemandCapacityNotification[] }) => {
        return notifications.length !== 0 ?
            <DemandCapacityNotificationTable onRowSelected={(notification) => {
                setModalOpen(true);
                setSelectedNotification(notification);
            }} notifications={notifications} /> :
            <Typography>No notifications available</Typography>
    }

    return (
        <>
            <Stack spacing={2} alignItems='center' width='100%' height='100%'>
                <h1 className="text-3xl font-semibold text-gray-700 mb-10">Demand And Capacity Notifications</h1>
                <Stack width='100%' direction="row" justifyContent="space-between">
                    <Tabs value={selectedTab} onChange={(_, value: number) => setSelectedTab(value)}>
                        {tabs.map((tab, index) => <Tab key={index} label={tab} />)}
                    </Tabs>
                    <Button variant="contained" onClick={() => {
                        setSelectedNotification(null);
                        setModalOpen(true)
                    }}>
                        <Add></Add> Send Notification
                    </Button>
                </Stack>
                <Box width='100%' display='flex' marginTop='0 !important' paddingBottom='2rem'>
                    {tabs.map((_, index) => (
                        <TabPanel key={index} value={selectedTab} index={index}>
                            <TabPanelContent notifications={demandCapacityNotification} />
                        </TabPanel>
                    ))}
                </Box>
            </Stack>

            <DemandCapacityNotificationInformationModal
                open={modalOpen}
                demandCapacityNotification={selectedNotification}
                onClose={() =>
                    setModalOpen(false)
                }
                onSave={fetchAndLogNotification}

            />
        </>
    );
};

type NotificationTableProps = {
    notifications: DemandCapacityNotification[],
    onRowSelected: (notification: DemandCapacityNotification) => void;
}

const DemandCapacityNotificationTable: React.FC<NotificationTableProps> = ({ notifications, onRowSelected }) => {
    return (
        <Box width="100%">
            <Table
                onRowClick={(value) => {
                    onRowSelected(value.row);
                }}
                title="Demand and Capacity Notifications"
                columns={[
                    { headerName: 'Text', field: 'text', width: 200 },
                    { headerName: 'Partners Bpnl', field: 'partnerBpnl', width: 200 },
                    { headerName: 'Leading Root Cause', field: 'leadingRootCause', width: 120, valueFormatter: (params) => LEADING_ROOT_CAUSE.find((cause) => cause.key === params.value)?.value },
                    { headerName: 'Effect', field: 'effect', width: 120, valueFormatter: (params) => EFFECTS.find((effect) => effect.key === params.value)?.value, },
                    { headerName: ' Affected Material Numbers', field: 'affectedMaterialNumbers', width: 200 },
                    { headerName: ' Affected Sites Sender', field: 'affectedSitesBpnsSender', width: 200 },
                    { headerName: ' Affected Sites Recipient', field: 'affectedSitesBpnsRecipient', width: 200 },
                    { headerName: 'Status', field: 'status', width: 100, valueFormatter: (params) => STATUS.find((status) => status.key === params.value)?.value },

                ]}
                rows={notifications ?? []}
                getRowId={(row) => row.uuid}
                noRowsMsg='No Notifications found'
            />
        </Box>
    );
}

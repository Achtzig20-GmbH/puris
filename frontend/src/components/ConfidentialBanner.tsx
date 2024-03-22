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

import { Box, Typography } from "@mui/material";
import palette from "../theme/palette";

export const ConfidentialBanner = () => {
    return (
        <Box sx={{
            backgroundColor: palette.error.light,
            fontWeight: '600',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
        }}>
            <Typography variant="body1" color="error">
                IMPORTANT: Please note that the data shown may be <b> competitively sensitive </b> and, according to appliable antitrust
                laws, <b> must not </b> be shared with competitors. Please consult your legal department, if necessary.
            </Typography>
        </Box>
    );
};

import * as React from "react";
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text
} from "@react-email/components";

export interface ResetPasswordEmailTemplateProps {
    appName: string;
    userName: string;
    resetUrl: string;
}

export function ResetPasswordEmailTemplate(props: ResetPasswordEmailTemplateProps): React.JSX.Element {
    const { appName, userName, resetUrl } = props;

    return (
        <Html>
            <Head />
            <Preview>Reset your password for {appName}</Preview>
            <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
                <Container
                    style={{
                        margin: "32px auto",
                        padding: "24px",
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        maxWidth: "560px"
                    }}
                >
                    <Heading style={{ marginTop: 0 }}>Reset Your Password</Heading>
                    <Text>Hello {userName},</Text>
                    <Text>
                        We received a request to reset your password for your {appName} account. Click the button
                        below to choose a new password.
                    </Text>
                    <Section style={{ margin: "24px 0" }}>
                        <Button
                            href={resetUrl}
                            style={{
                                backgroundColor: "#0f172a",
                                borderRadius: "6px",
                                color: "#ffffff",
                                padding: "12px 18px",
                                textDecoration: "none"
                            }}
                        >
                            Reset Password
                        </Button>
                    </Section>
                    <Text style={{ color: "#64748b", fontSize: "13px" }}>
                        If you did not request a password reset, you can safely ignore this email. The link will
                        expire shortly.
                    </Text>
                    <Hr />
                    <Text style={{ color: "#94a3b8", fontSize: "12px" }}>{appName}</Text>
                </Container>
            </Body>
        </Html>
    );
}

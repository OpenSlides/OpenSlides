{
    "strict": true,
    "debug": true,
    "sp": {
        "entityId": "https://sp.domain.xyz/apps/saml/metadata/",
        "assertionConsumerService": {
            "url": "https://sp.domain.xyz/apps/saml/?acs",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        },
        "singleLogoutService": {
            "url": "https://sp.domain.xyz/apps/saml/?sls",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
        "x509cert": "",
        "privateKey": ""
    },
    "idp": {
        "entityId": "https://idp.domain.xyz/metadata",
        "singleSignOnService": {
            "url": "https://idp.domain.xyz/sso",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "singleLogoutService": {
            "url": "https://idp.domain.xyz/slo",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "x509cert": ""
    },
    "security": {
        "nameIdEncrypted": false,
        "authnRequestsSigned": false,
        "logoutRequestSigned": false,
        "logoutResponseSigned": false,
        "signMetadata": false,
        "wantMessagesSigned": false,
        "wantAssertionsSigned": false,
        "wantNameId" : true,
        "wantNameIdEncrypted": false,
        "wantAssertionsEncrypted": false,
        "signatureAlgorithm": "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
        "digestAlgorithm": "http://www.w3.org/2000/09/xmldsig#sha1"
    },
    "contactPerson": {
        "technical": {
            "givenName": "technical_name",
            "emailAddress": "technical@example.com"
        },
        "support": {
            "givenName": "support_name",
            "emailAddress": "support@example.com"
        }
    },
    "organization": {
        "en-US": {
            "name": "OpenSlides",
            "displayname": "OpenSlides",
            "url": "http://openslides.org"
        }
    },
    "generalSettings": {
        "loginButtonText": "Login via SAML",
        "changePasswordUrl": "https://idp.domain.xyz"
    },
    "attributeMapping": {
        "UserID":       ["username",    true],
        "FirstName":    ["first_name",  false],
        "LastName":     ["last_name",   false]
    }
}

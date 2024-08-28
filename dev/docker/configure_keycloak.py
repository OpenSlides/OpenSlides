from os import environ

from keycloak import KeycloakAdmin

print("Configuring Keycloak...")
# print the environment variables
print(f"KEYCLOAK_URL: {environ.get('KEYCLOAK_URL')}")
print(f"KEYCLOAK_ADMIN: {environ.get('KEYCLOAK_ADMIN')}")
print(f"KEYCLOAK_ADMIN_PASSWORD: {environ.get('KEYCLOAK_ADMIN_PASSWORD')}")

# Initialize KeycloakAdmin client
keycloak_admin = KeycloakAdmin(server_url=environ.get("KEYCLOAK_URL"),
                               username=environ.get("KEYCLOAK_ADMIN"),
                               password=environ.get("KEYCLOAK_ADMIN_PASSWORD"),
                               realm_name="master",
                               verify=False)


# Function to create or get realm
def create_or_get_realm(realm_name):
    realms = keycloak_admin.get_realms()
    if not any(realm.get('realm') == realm_name for realm in realms):
        keycloak_admin.create_realm(payload={"realm": realm_name, "enabled": True})
        print(f"Created realm: {realm_name}")
    else:
        print(f"Realm {realm_name} already exists.")


# Function to create or get client scope with protocol mappers
def create_or_get_client_scope(realm_name, client_scope_name, protocol_mappers):
    keycloak_admin.realm_name = realm_name
    client_scopes = keycloak_admin.get_client_scopes()
    client_scope_id = None

    # Check if the client scope exists
    for scope in client_scopes:
        if scope.get('name') == client_scope_name:
            client_scope_id = scope['id']
            break

    # Create the client scope if it doesn't exist
    if client_scope_id is None:
        client_scope_id = keycloak_admin.create_client_scope(
            payload={"name": client_scope_name, "protocol": "openid-connect"})
        print(f"Created client scope: {client_scope_name}")

    # Retrieve existing protocol mappers for the client scope
    existing_mappers = keycloak_admin.get_mappers_from_client_scope(client_scope_id)

    # Add new protocol mappers if they don't already exist
    for mapper in protocol_mappers:
        if not any(em['name'] == mapper['name'] for em in existing_mappers):
            keycloak_admin.add_mapper_to_client_scope(client_scope_id=client_scope_id, payload=mapper)
            print(f"Added protocol mapper: {mapper['name']} to client scope: {client_scope_name}")
        else:
            print(f"Protocol mapper {mapper['name']} already exists in client scope: {client_scope_name}")


# Function to create or get client
def create_or_get_client(realm_name, client_name, client_scope_name):
    keycloak_admin.realm_name = realm_name
    clients = keycloak_admin.get_clients()
    if not any(client.get('clientId') == client_name for client in clients):
        keycloak_admin.create_client(
            payload={"clientId": client_name, "protocol": "openid-connect", "defaultClientScopes": [client_scope_name],
                     "directAccessGrantsEnabled": True, "publicClient": True, "redirectUris":
                         ["http://localhost/*",
                          "https://localhost:8000/*"]})
        print(f"Created client: {client_name}")
    else:
        print(f"Client {client_name} already exists.")


# Function to create or get user
def create_or_get_user(realm_name, users: list[tuple[str, int, str]]):
    keycloak_admin.realm_name = realm_name
    for user_data in users:
        users = keycloak_admin.get_users(query={"username": user_data[0]})
        user_representation = {"username": user_data[0],
                               "enabled": True,
                               "emailVerified": True,
                               "firstName": user_data[0],
                               "lastName": "User",
                               "attributes": {"os-userid": user_data[1]},
                               "credentials": [{"type": "password", "value": user_data[2], "temporary": False}]}
        if not users:
            keycloak_admin.create_user(
                user_representation)
            print(f"Created user: {user_data[0]}")
        else:
            keycloak_admin.update_user(user_id=users[0]['id'], payload=user_representation)
            print(f"User {user_data[0]} already exists.")


if __name__ == '__main__':
    realm_name = "os"
    client_scope_name = "os"
    client_name = "os-ui"
    protocol_mappers = [
        {
            "name": "email-mapper",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-property-mapper",
            "config": {
                "user.attribute": "email",
                "claim.name": "email",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "jsonType.label": "String"
            }
        },
        {
            "name": "userid-mapper",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-attribute-mapper",
            "config": {
                "user.attribute": "os-userid",
                "claim.name": "userId",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "jsonType.label": "String"
            }
        },
        {
            "name": "username-mapper",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-property-mapper",
            "config": {
                "user.attribute": "username",
                "claim.name": "username",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "jsonType.label": "String"
            }
        },
        {
            "name": "firstname-mapper",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-property-mapper",
            "config": {
                "user.attribute": "firstName",
                "claim.name": "firstName",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "jsonType.label": "String"
            }
        },
        {
            "name": "lastname-mapper",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-property-mapper",
            "config": {
                "user.attribute": "lastName",
                "claim.name": "lastName",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "jsonType.label": "String"
            }
        },
        # {
        #     "name": "roles-mapper",
        #     "protocol": "openid-connect",
        #     "protocolMapper": "user-roles-mapper",
        #     "config": {
        #         "multivalued": "true",
        #         "userinfo.token.claim": "true",
        #         "id.token.claim": "true",
        #         "access.token.claim": "true",
        #         "claim.name": "roles"
        #     }
        # },
        {
            "name": "Hardcoded Value",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-hardcoded-claim-mapper",
            "config": {
                "claim.name": "is-active-mapper",
                "claim.value": "1",
                "claim.token": "id_token",
                "jsonType.label": "String",
                "id.token.claim": "true",
                "access.token.claim": "true"
            }
        }

    ]

    # Execute functions
    create_or_get_realm(realm_name)
    create_or_get_client_scope(realm_name, client_scope_name, protocol_mappers)
    create_or_get_client(realm_name, client_name, client_scope_name)
    # TODO: ab--hardcoded user names, user ids must match with test data in database
    user_names = [("admin", 1, "admin"), ("user", 2, "password")]
    create_or_get_user(realm_name, user_names)

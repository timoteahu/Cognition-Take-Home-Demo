import { registerRole } from "@internal-tools/framework";

// Tool-local permission strings, registered onto the shared roles.
registerRole("builder", ["kyc:read", "kyc:write"]);
registerRole("viewer", ["kyc:read"]);

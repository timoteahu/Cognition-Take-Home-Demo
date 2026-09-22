import { registerRole } from "@internal-tools/framework";

// Tool-local permission strings, registered onto the shared roles.
registerRole("builder", ["chargebacks:read", "chargebacks:write"]);
registerRole("viewer", ["chargebacks:read"]);

# Modules

Each domain module owns its business facts, domain rules, application use cases, and ports.
Delivery code calls an owning application use case; modules must not reach into another module's repositories or tables.

Create a module only with its approved domain implementation. The intended domain list is defined by `Documents/DOMAIN-MAP.md`.

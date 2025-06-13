import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function pulumiDODropletsDemo(server: McpServer) {
  server.tool(
    "pulumi_do_droplets_demo",
    "Get instructions for creating a scalable web server infrastructure on DigitalOcean using Pulumi with Typescript",
    () => {
      const prompt =
        `# DigitalOcean Load-Balanced Web Server Infrastructure Demo

You need to create a scalable web server infrastructure on DigitalOcean using Pulumi with TypeScript. This will demonstrate a complete Infrastructure-as-Code workflow from creation to local deployment.

## Infrastructure Requirements

**Core Architecture:**
- Deploy multiple web server droplets behind a load balancer for high availability
- Each droplet should automatically install and configure nginx web server
- Load balancer should distribute HTTP traffic across all web servers
- All resources should be properly tagged for organization and cost tracking
- Prioritze simplicity and do not include complex setup steps such as configuring SSH keys or VPC

**Default Configuration (but allow the user to customize):**
- **Number of droplets**: 2 (but allow the user to specify a different count if needed)
- **Droplet specifications**: Use cost-effective small droplets (1 vCPU, 1GB RAM)
- **Operating system**: Ubuntu 20.04 LTS x64
- **Region**: Choose a reasonable default region (NYC3 or similar)
- **Networking**: Enable private networking between droplets

**Load Balancer Setup:**
- Create a DigitalOcean Load Balancer to distribute traffic
- Configure HTTP forwarding (port 80 to port 80)
- Set up basic health checks to ensure droplets are responding
- Use TCP health checks on port 80 for simplicity

**Automation Requirements:**
- Use cloud-init/user-data to automatically install nginx on each droplet
- Configure basic nginx setup that serves a simple default page
- No manual configuration should be required after deployment

**Resource Organization:**
- Create appropriate tags for resource management
- Tag droplets individually (e.g., "web-0", "web-1")
- Create a shared application tag for all resources in this deployment
- Use the Pulumi stack name in tagging for environment separation

**Outputs:**
- Export the load balancer's public IP address so the user can test the deployment
- This IP should be accessible via HTTP to see the nginx welcome page

## Technical Specifications

**Project Setup:**
- Use Pulumi with Node.js/TypeScript runtime
- Include proper dependencies for DigitalOcean provider
- Set up appropriate TypeScript configuration
- Ensure the project is ready for local development and deployment

**Security Considerations:**
- Use DigitalOcean's default security groups initially
- Enable private networking for backend communication
- Keep the setup simple but mention security best practices

**Scalability Design:**
- Make the number of droplets easily configurable
- Use loops/iteration to create multiple droplets rather than hardcoding each one
- Design tags and load balancer configuration to easily accommodate additional droplets

## Complete Demo Workflow

This demo will demonstrate the full Infrastructure-as-Code lifecycle:

1. **Project Creation**: Interactive project creation with file-by-file confirmation
2. **Project Analysis**: Understand the generated project structure
3. **Local Development**: The user will clone the project to their local development environment
4. **Configuration**: The user will configure their DigitalOcean credentials locally
5. **Deployment**: The user will deploy the infrastructure using local Pulumi CLI
6. **Testing**: The user will test the deployed load balancer and web servers
7. **Cleanup**: The user will tear down the infrastructure when done

## Interactive File Creation Process

After project initialization, you will:

1. **File-by-File Creation**: For each file that needs modification or creation:
   - Describe what the file does and why it's needed
   - Show the complete content that will be written
   - Explain key components and their purpose
   - Wait for the user's "proceed" or "yes" before writing the file
   - Move to the next file only after confirmation

This interactive approach ensures the user understands every component before it's created and can stop or modify the process at any point.

## Configuration Questions

Before you start building, please ask the user:
- How many web server droplets would they like? (default: 2)
- Any preference for DigitalOcean region? (default: NYC3)
- Any specific droplet size requirements? (default: s-1vcpu-1gb)
- Or would they like to use the default values?

Then proceed with creating the Pulumi project with these specifications. Make sure to explain what each component does as you build it, since this is for learning purposes.

## Interactive Project Creation Steps

You must follow this exact sequence for creating the project:

### Step 1: Project Initialization
1. You initialize a new Pulumi TypeScript project

### Step 2: Interactive File Creation
For each file that needs to be created or modified, you must:
1. **Explain the File**: Describe what this file does and why it's needed
2. **Show the Content**: Display the complete content that will be written
3. **Explain Key Components**: Break down important parts of the code
4. **Wait for Confirmation**: Ask the user to type "proceed" or "yes" before writing
5. **Write the File**: Only proceed after explicit user confirmation
6. **Move to Next File**: Repeat for each remaining file

### Step 3: Project Validation & Quality Assurance
After all files are created:
1. **Code Validation**: Verify TypeScript compilation and dependencies
2. **Infrastructure Validation**: Run 'pulumi preview' to validate the plan
3. **Issue Resolution**: Fix any problems found during validation
4. **Quality Checks**: Ensure proper tagging, outputs, and best practices
5. **Final Validation**: Confirm everything is ready for deployment

**IMPORTANT**:
- Stop the creation process after 20 interactive steps to avoid recursion limits
- Only provide the clone URL after successful validation
- Each file creation requires explicit user confirmation

## Post-Validation Instructions

After you complete the project creation AND validation, provide the user with:

1. **Validation Summary**: Brief report of what was checked and any issues that were fixed
2. **Git Clone URL**: The repository URL so the user can clone the validated project locally
3. **Local Setup Instructions**:
    - How to install dependencies ('npm install')
    - How to configure DigitalOcean credentials
    - How to create and configure a Pulumi stack
4. **Deployment Commands**:
    - How to preview the infrastructure ('pulumi preview')
    - How to deploy the infrastructure ('pulumi up')
5. **Testing Instructions**:
    - How to get the load balancer IP address
    - How to test the web servers are responding
6. **Cleanup Commands**:
    - How to destroy the infrastructure ('pulumi destroy')
    - How to remove the stack ('pulumi stack rm')

## Extension Opportunities

After the basic deployment is working, offer suggestions for additional improvements the user could make to this infrastructure, such as:
- Adding SSL/TLS certificates
- Implementing monitoring and alerting
- Adding a database backend
- Setting up CI/CD pipelines
- Implementing blue-green deployments
- Configuring SSH keys or VPC

This should provide a comprehensive learning experience that demonstrates the complete Infrastructure-as-Code workflow from creation to deployment.`;

      return {
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      };
    },
  );
}

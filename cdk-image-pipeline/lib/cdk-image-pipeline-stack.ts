import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as imagebuilder from "aws-cdk-lib/aws-imagebuilder";

export class CdkImagePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define IAM Role
    const role = new iam.Role(this, 'ImageBuilderRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('EC2InstanceProfileForImageBuilder'));

    // Define the Image Builder components
    const component = new imagebuilder.CfnComponent(this, 'ImageBuilderComponent', {
      name: 'MyComponent',
      platform: 'Linux',
      version: '1.0.0',
      data: `description: DummyInstall
schemaVersion: 1.0
parameters:
  - testparam:
      type: string
      default: "test"
      description: "sample parameter example."
phases:
    - name: build
      steps:
        - name: UpdatePackage
          action: ExecuteBash
          inputs:
            commands:
                - echo "First"
                - sudo echo First > ~/test.txt
                - sudo cat ~/test.txt`
    });

    // Define the Image Recipe
    const recipe = new imagebuilder.CfnImageRecipe(this, 'MyImageRecipe', {
      name: 'MyImageRecipe',
      version: '1.0.0',
      components: [{ componentArn: component.attrArn }],
      parentImage: 'arn:aws:imagebuilder:us-west-2:aws:image/amazon-linux-2-x86/x.x.x'
    });

    // Define the Image Pipeline
    new imagebuilder.CfnImagePipeline(this, 'MyImagePipeline', {
      name: 'MyImagePipeline',
      imageRecipeArn: recipe.attrArn,
      infrastructureConfigurationArn: 'arn:aws:imagebuilder:us-west-2:123456789012:infrastructure-configuration/my-infrastructure-configuration',
      schedule: {
        scheduleExpression: 'cron(0 0 * * ? *)'
      }
    });
  }
}


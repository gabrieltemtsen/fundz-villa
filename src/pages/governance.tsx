import { Features, Footer, Hero, Navbar, Sponsors } from "@/components";
import {
  Image,
  Badge,
  Box,
  Button,
  Center,
  Text,
  Checkbox,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  chakra,
  InputRightElement,
  SimpleGrid,
  Stack,
  VStack,
  useColorModeValue,
  Progress,
  ModalOverlay,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useContractRead } from "wagmi";
import { readContract } from "@wagmi/core";
import axios from "axios";
import {
  CAMPAIGN_ABI,
  CAMPAIGN_MANAGER,
  CAMPAIGN_MANAGER_ABI,
} from "@/constants/contract";
import { Masa } from "@masa-finance/masa-sdk";
import { shortenString } from "@/helpers/shortenString";
import { shortenAddress } from "@/helpers/shortenAddress";
import Link from "next/link";
import { providers } from "ethers";
import toast, { Toaster } from "react-hot-toast";

type CampaignDetail = {
  campaignId: number;
  coverImage: string;
  isVerified: boolean;
  campaignTitle: string;
  campaignTarget: string;
  campaignDescription: string;
  campaignOwner: string;
  campaignScAddress: string;
};
type Campaign = {
  campaign_ID: number;
  coverImage: any;
  campaignName: string;
  campaign_description: string;
  poster_address: any;
  projectDetails: any;
};

function Campaigns() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [allCampaigns, setallCampaigns] = useState<any[]>([]);
  const [noOfcampaigns, setNoOfcampaigns] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [inTxn, setInTxn] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const getallCampaigns = async () => {
    const [account] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    try {
      const masa = new Masa({
        signer: account,
        environment: "dev",
        networkName: "alfajores",
      });

      const allCampaignsAddresses: any = await readContract({
        address: CAMPAIGN_MANAGER,
        abi: CAMPAIGN_MANAGER_ABI,
        functionName: "getAllCampaigns",
      });
     

      let new_campaigns = [];

      for (let i = 0; i < allCampaignsAddresses.length; i++) {
        const campaignCID: any = await readContract({
          address: allCampaignsAddresses[i],
          abi: CAMPAIGN_ABI,
          functionName: "campaignCID",
        });
        const campaignId: any = await readContract({
          address: allCampaignsAddresses[i],
          abi: CAMPAIGN_ABI,
          functionName: "id",
        });
        const campaignOwner: any = await readContract({
          address: allCampaignsAddresses[i],
          abi: CAMPAIGN_ABI,
          functionName: "owner",
        });
        const campaignTarget: any = await readContract({
          address: allCampaignsAddresses[i],
          abi: CAMPAIGN_ABI,
          functionName: "target",
        });

        if (campaignCID) {
          let config: any = {
            method: "get",
            url: `https://${campaignCID}.ipfs.w3s.link/obj.json`,
            headers: {},
          };
          const axiosResponse = await axios(config);

          const campaignDataObject: Campaign = axiosResponse.data;

          const soul = await masa.soulName.list(campaignOwner);
          let SOULNAME = "";
          if (soul[0]) {
            SOULNAME = soul[0].tokenDetails.sbtName;
          }

          const CampaignObj = {
            campaignId: Number(campaignId),
            campaignOwner: campaignOwner,
            soulname: SOULNAME,
            campaignTarget: Number(campaignTarget),
            campaignTitle: campaignDataObject.campaignName,
            campaignDescription: campaignDataObject.projectDetails,
            coverImage: campaignDataObject.coverImage,
            campaignScAddress: allCampaignsAddresses[i],
            isVerified: false,
          };
          console.log("here", CampaignObj);

          new_campaigns.push(CampaignObj);
        }
      }

      setallCampaigns(new_campaigns);
    } catch (error) {
      console.log(error);
    }
  };

  const sendOTP = async() => {

    try {
      const provider = new providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      
  
      const masa = new Masa({
        signer: signer,
        environment: "dev",
        networkName: "alfajores",
        apiUrl: " https://dev.middleware.masa.finance/",
      });
      const result = await masa.session.login();
      const isLoggedIn = await masa.session.checkLogin();
 
      const generateOTP = await masa.green.generate(phoneNumber);
      if(generateOTP.success) {
       setOtpSent(true)
       toast.success('OTP Sent')
      }
      else if(generateOTP.status == 'failed') {
        toast.error(generateOTP.message)
      }
    } catch (error) {
      toast.error('something went wrong pleast try again')
      
    }
   


  }
  const createSBTAndJoinDAO = async () => {
    try {
     const provider = new providers.Web3Provider(window.ethereum);
     const signer = provider.getSigner();
 
     
 
     const masa = new Masa({
       signer: signer,
       environment: "dev",
       networkName: "alfajores",
       apiUrl: " https://dev.middleware.masa.finance/",
     });
     setInTxn(true)
     const result = await masa.session.login();
     const isLoggedIn = await masa.session.checkLogin();

     const isGreener = await masa.green.list(signer._address)
     console.log(isGreener)

     
     if(otpSent|| !isGreener) {
        const createGreen = await masa.green.create('CELO', phoneNumber, otpCode)
        if(createGreen){
          console.log('success')
          toast.success('Masa green Minted welcome onBoard')
          setOtpSent(false)
          setPhoneNumber('')
          setOtpCode('')
          onClose();
        } else{
          toast.error('oops..Account Exists!')
          onClose();

        }


     }

     
 
     
 
     
     
    } catch (error) {
     console.log(error)
     setInTxn(false)
    }
   };

  useEffect(() => {
    getallCampaigns();
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 6500);

    // Cleanup function to clear the timeout when the component unmounts
    return () => clearTimeout(timeout);
  }, [noOfcampaigns]);
  return (
    <>
      <Navbar />
      <Toaster />
      <main
        className={`main-color flex min-h-screen flex-col items-center justify-between p-24 `}
      >
        <Text fontWeight={20} color={"white"} fontSize={27}>
          {" "}
          VOTE ON CAMPAIGNS AUTHENTICITY
        </Text>
        <Text
          mt="1"
          fontWeight="semibold"
          noOfLines={3}
          lineHeight="tight"
          color="gray.600"
          fontSize="sm"
        >
          NB: You have to be a FundzVilla DAO member to Vote on Campaigns
          <br />
          <Center>
            <chakra.button
              w={{ base: "100%", sm: "auto" }}
              textAlign={"center"}
              h={12}
              px={6}
              mt={5}
              color="white"
              rounded="md"
              mb={{ base: 2, sm: 0 }}
              zIndex={5}
              lineHeight={1}
              bgGradient="linear(to-l, #0ea5e9,#2563eb)"
              _hover={{
                bgGradient: "linear(to-l, #0ea5e9,#2563eb)",
                opacity: 0.9,
              }}
              onClick={onOpen}
            >
              <chakra.span> Join FundzVilla DAO </chakra.span>
            </chakra.button>
          </Center>
        </Text>
        <div>
        {isLoading ? (
        <>
          <Text color={'white'}>Loading campaigns please wait...</Text>
          <Progress size="xs" isIndeterminate mb={5} />
        </>
      ) : (
          <Container
            maxWidth="1200px"
            mx="auto"
            my="auto"
            p={{ base: 5, md: 10 }}
          >
            <SimpleGrid columns={[1, 2, 3]} spacing="20px">
              {allCampaigns.map((campaign) => {
                return (
                  <Box position="relative" key={campaign.campaignId}>
                    <Box
                      fontSize="sm"
                      position="absolute"
                      right="5px"
                      margin="5px"
                      zIndex="1"
                    >
                      {campaign.isVerified ? (
                        <Badge
                          rounded="full"
                          p="2px 8px"
                          colorScheme="green"
                          backgroundColor={"green.600"}
                        >
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          rounded="full"
                          p="2px 8px"
                          colorScheme="red"
                          backgroundColor={"yellow.600"}
                        >
                          Not Verified
                        </Badge>
                      )}
                    </Box>
                    <Link
                      href={{
                        query: {
                          addr: campaign.campaignScAddress,
                          // campaignId: campaign.campaignID,
                        },
                        pathname: `/campaign/${campaign.campaignScAddress}`,
                      }}
                    >
                      <Box
                        borderWidth="1px"
                        shadow="md"
                        rounded="lg"
                        overflow="hidden"
                        position="relative"
                      >
                        <Image
                          boxSize="338px"
                          src={`https://ipfs.io/ipfs/${campaign.coverImage}`}
                          alt="Blog image"
                          objectFit={'cover'}
                          width={'full'}
                        />
                        <Box p={{ base: 4, lg: 6 }}>
                          <Box display="flex" alignItems="baseline">
                            <Box
                              fontWeight="semibold"
                              as="h2"
                              letterSpacing="wide"
                              
                              ml="2"
                              color={"white"}
                            >
                              {campaign.campaignTitle}
                            </Box>
                          </Box>
                          <Box>
                            <Box color="gray.600" fontSize="sm">
                              <Badge  textTransform={"lowercase"} rounded="full" px="2" colorScheme="teal">
                              {campaign.soulname ||
                                  shortenAddress(campaign.campaignOwner)}
                              </Badge>
                            </Box>
                            <Text mt={1} color="white" ml={1}>
                              <strong>{campaign.campaignTarget} celo</strong>{" "}
                            </Text>
                          </Box>
                          <Text
                            mt="1"
                            fontWeight="semibold"
                            noOfLines={3}
                            lineHeight="tight"
                            color="gray.600"
                            fontSize="sm"
                          >
                            {shortenString(campaign.campaignDescription)}
                          </Text>
                        </Box>
                        <chakra.button
                          w={{ base: "50%", sm: "auto" }}
                          h={9}
                          px={6}
                          ml={5}
                          color="white"
                          rounded="md"
                          mb={4}
                          zIndex={5}
                          lineHeight={1}
                          bgGradient="linear(to-l, #0ea5e9,#2563eb)"
                          _hover={{
                            bgGradient: "linear(to-l, #0ea5e9,#2563eb)",
                            opacity: 0.9,
                          }}
                        >
                          <chakra.span> Vote For </chakra.span>
                        </chakra.button>
                        <chakra.button
                          w={{ base: "50%", sm: "auto" }}
                          h={9}
                          px={6}
                          ml={5}
                          color="white"
                          rounded="md"
                          mb={4}
                          zIndex={5}
                          lineHeight={1}
                          bgGradient="linear(to-l, #AA4A44,#FF0000)"
                          _hover={{
                            bgGradient: "linear(to-l, #0ea5e9,#FF0000)",
                            opacity: 0.9,
                          }}
                        >
                          <chakra.span> Vote Against </chakra.span>
                        </chakra.button>
                      </Box>
                    </Link>
                  </Box>
                );
              })}
            </SimpleGrid>
            <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Lets Mint you a Masa Green SBT</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Phone Number</FormLabel>
              <Input
                placeholder="please include country code(+234905..)"
                _placeholder={{ color: "gray.500" }}
                type="text"
                required
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                }}
              />
              <Button mt={3} colorScheme="blue" mr={3} onClick={sendOTP}>
              Request otp
            </Button>
            </FormControl>
            {otpSent && (
              <>
                <Text mt={2}>OTP Sent..</Text>
              </>
            )}
            <FormControl mt={3} isRequired>
              <FormLabel>OTP</FormLabel>
              <Input
                placeholder="OTP"
                _placeholder={{ color: "gray.500" }}
                type="text"
                required
                onChange={(e) => {
                  setOtpCode(e.target.value);
                }}
              />
            </FormControl>
            
           
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost" onClick={createSBTAndJoinDAO}>
              Join FundzVilla
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
          </Container>
           )}
        </div>
     

        <Footer />
      </main>
    </>
  );
}

export default Campaigns;

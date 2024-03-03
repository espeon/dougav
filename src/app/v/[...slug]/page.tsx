export default function VideoPage({params}: {params: {slug: string[]}}) {
    // get the slug
  return (
    <div className="h-screen flex justify-center items-center">
      <div className="h-[50vh] min-h-[50%]">
        <video src={`/api/raw?path=${params.slug.join("/")}`} controls={true} autoPlay={true} className="w-full h-full" />
        <div className="text-xl mt-2 mx-2">{decodeURIComponent(params.slug[params.slug.length - 1])}</div>
      </div>
    </div>
  )
}
